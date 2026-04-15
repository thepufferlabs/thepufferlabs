// Mini World Bank Analytics Platform — Edge Function
// Fetches World Bank indicators, stores raw + normalized data in Supabase Postgres.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Configuration ───────────────────────────────────────────
const WB_API_BASE = "https://api.worldbank.org/v2";
const DEFAULT_COUNTRIES = ["IND", "USA", "CHN", "GBR"];
const DEFAULT_INDICATORS = [
  "NY.GDP.MKTP.CD",   // GDP (current US$)
  "NY.GDP.MKTP.KD.ZG",// GDP growth (annual %)
  "NY.GDP.PCAP.CD",   // GDP per capita (current US$)
  "NY.GDP.PCAP.KD.ZG",// GDP per capita growth (annual %)
  "FP.CPI.TOTL.ZG",   // Inflation, consumer prices (annual %)
  "NE.TRD.GNFS.ZS",   // Trade (% of GDP)
  "BX.KLT.DINV.CD.WD",// Foreign direct investment, net inflows (BoP, current US$)
  "SL.UEM.TOTL.ZS",   // Unemployment, total (% of total labor force)
  "SL.TLF.CACT.ZS",   // Labor force participation rate (% of total population ages 15+)
  "SP.POP.TOTL",       // Population, total
  "SP.POP.GROW",       // Population growth (annual %)
  "SP.URB.TOTL.IN.ZS", // Urban population (% of total population)
  "SP.DYN.LE00.IN",    // Life expectancy at birth, total (years)
  "SH.XPD.CHEX.GD.ZS", // Current health expenditure (% of GDP)
  "SE.ADT.LITR.ZS",   // Literacy rate, adult total (% of people ages 15 and above)
  "SE.XPD.TOTL.GD.ZS",// Government expenditure on education, total (% of GDP)
  "EG.USE.ELEC.KH.PC", // Electric power consumption (kWh per capita)
  "IT.NET.USER.ZS",   // Individuals using the Internet (% of population)
  "EN.ATM.CO2E.PC",   // CO2 emissions (metric tons per capita)
  "NY.GNP.PCAP.CD",   // GNI per capita, Atlas method (current US$)
];
const PER_PAGE = 1000;
const MAX_RETRIES = 3;
const RATE_LIMIT_DELAY_MS = 1000; // 1s between API calls

// ─── Types ───────────────────────────────────────────────────
interface WBApiMetadata {
  page: number;
  pages: number;
  per_page: string;
  total: number;
}

interface WBDataPoint {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
  obs_status: string;
  decimal: number;
}

interface SyncStats {
  rows_inserted: number;
  rows_updated: number;
  rows_skipped: number;
}

// ─── Helpers ─────────────────────────────────────────────────
function log(level: string, msg: string, data?: Record<string, unknown>) {
  const entry = { ts: new Date().toISOString(), level, msg, ...data };
  if (level === "error") {
    console.error(JSON.stringify(entry));
    return;
  }
  console.warn(JSON.stringify(entry));
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(
  url: string,
  retries = MAX_RETRIES,
  backoff = 1000
): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(url);
      if (resp.status === 429) {
        const wait = backoff * Math.pow(2, attempt - 1);
        log("warn", "Rate limited, backing off", { attempt, wait_ms: wait });
        await sleep(wait);
        continue;
      }
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }
      return resp;
    } catch (err) {
      if (attempt === retries) throw err;
      const wait = backoff * Math.pow(2, attempt - 1);
      log("warn", "Fetch failed, retrying", {
        attempt,
        wait_ms: wait,
        error: (err as Error).message,
      });
      await sleep(wait);
    }
  }
  throw new Error("fetchWithRetry: exhausted retries");
}

// ─── World Bank API Client ───────────────────────────────────
async function fetchIndicatorData(
  indicator: string,
  countries: string[],
  runId: string,
  supabase: ReturnType<typeof createClient>
): Promise<WBDataPoint[]> {
  const countryList = countries.join(";");
  const allData: WBDataPoint[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url =
      `${WB_API_BASE}/country/${countryList}/indicator/${indicator}` +
      `?format=json&per_page=${PER_PAGE}&page=${page}&date=2000:2025`;

    log("info", "Fetching page", { indicator, page, url });
    const resp = await fetchWithRetry(url);
    const json = await resp.json();

    // WB API returns [metadata, data[]] or [metadata, null]
    if (!Array.isArray(json) || json.length < 2) {
      log("warn", "Unexpected API response shape", { indicator, page });
      break;
    }

    const meta: WBApiMetadata = json[0];
    const data: WBDataPoint[] | null = json[1];
    totalPages = meta.pages;

    // Store raw payload for audit
    await supabase.from("wb_raw_observations").insert({
      job_run_id: runId,
      request_url: url,
      payload_json: json,
      page,
      total_pages: totalPages,
    });

    if (data && data.length > 0) {
      allData.push(...data);
    }

    page++;
    if (page <= totalPages) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  log("info", "Fetched indicator data", {
    indicator,
    total_points: allData.length,
  });
  return allData;
}

// ─── Transform + Upsert ─────────────────────────────────────
async function upsertIndicatorValues(
  data: WBDataPoint[],
  supabase: ReturnType<typeof createClient>
): Promise<SyncStats> {
  const stats: SyncStats = { rows_inserted: 0, rows_updated: 0, rows_skipped: 0 };
  const BATCH_SIZE = 200;

  // Filter valid data points
  const rows = data
    .filter((d) => d.value !== null && d.countryiso3code && d.date)
    .map((d) => ({
      country_code: d.countryiso3code,
      indicator_code: d.indicator.id,
      year: parseInt(d.date, 10),
      value: d.value,
      unit: d.unit || null,
      source_update_date: null,
      ingested_at: new Date().toISOString(),
    }));

  stats.rows_skipped = data.length - rows.length;

  // Batch upsert
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { data: result, error } = await supabase
      .from("wb_indicator_values")
      .upsert(batch, {
        onConflict: "country_code,indicator_code,year",
        ignoreDuplicates: false,
      })
      .select("country_code");

    if (error) {
      log("error", "Upsert batch failed", {
        batch_start: i,
        error: error.message,
      });
      throw error;
    }

    stats.rows_inserted += result?.length ?? batch.length;
    log("info", "Upserted batch", {
      batch_start: i,
      batch_size: batch.length,
    });
  }

  return stats;
}

// ─── Overlap Guard ───────────────────────────────────────────
async function checkOverlappingRun(
  supabase: ReturnType<typeof createClient>
): Promise<boolean> {
  const { data } = await supabase
    .from("wb_sync_runs")
    .select("run_id, started_at")
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    const runningFor =
      Date.now() - new Date(data[0].started_at).getTime();
    // Allow if stuck > 30 min (stale lock)
    if (runningFor < 30 * 60 * 1000) {
      log("warn", "Overlapping run detected", {
        existing_run: data[0].run_id,
        running_for_ms: runningFor,
      });
      return true;
    }
    // Mark stale run as failed
    await supabase
      .from("wb_sync_runs")
      .update({ status: "cancelled", finished_at: new Date().toISOString(), error_message: "Cancelled: stale lock" })
      .eq("run_id", data[0].run_id);
  }
  return false;
}

// ─── Main Handler ────────────────────────────────────────────
Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Parse optional overrides from request body
  let countries = DEFAULT_COUNTRIES;
  let indicators = DEFAULT_INDICATORS;
  let batchId: string | null = null;
  let source = "world_bank";
  try {
    if (req.method === "POST") {
      const body = await req.json();
      if (body.countries?.length) countries = body.countries;
      if (body.indicators?.length) indicators = body.indicators;
      if (body.batch_id) batchId = body.batch_id;
      if (body.source) source = body.source;
    }
  } catch {
    // Use defaults
  }

  // Guard against overlapping runs
  if (await checkOverlappingRun(supabase)) {
    return new Response(
      JSON.stringify({ error: "Another sync is already running" }),
      { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create sync run record
  const runInsert: Record<string, unknown> = {
    status: "running",
    indicators,
    countries,
    source,
  };
  if (batchId) runInsert.batch_id = batchId;

  const { data: runData, error: runError } = await supabase
    .from("wb_sync_runs")
    .insert(runInsert)
    .select("run_id")
    .single();

  if (runError || !runData) {
    log("error", "Failed to create sync run", { error: runError?.message });
    return new Response(
      JSON.stringify({ error: "Failed to initialize sync run" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const runId = runData.run_id;
  log("info", "Sync run started", {
    runId,
    batch_id: batchId,
    source,
    indicator_count: indicators.length,
    country_count: countries.length,
    indicators,
    countries,
  });

  const totalStats: SyncStats = { rows_inserted: 0, rows_updated: 0, rows_skipped: 0 };

  try {
    // Process each indicator sequentially (respect rate limits)
    for (const indicator of indicators) {
      log("info", "Processing indicator", {
        indicator,
        runId,
        country_count: countries.length,
        progress: `${indicators.indexOf(indicator) + 1}/${indicators.length}`,
      });

      try {
        const data = await fetchIndicatorData(indicator, countries, runId, supabase);

        if (data.length === 0) {
          log("warn", "No data returned for indicator", { indicator, countries });
          continue;
        }

        // Upsert country metadata from the API response
        const countryMap = new Map<string, { name: string; iso3: string }>();
        for (const d of data) {
          if (d.countryiso3code && d.country?.value) {
            countryMap.set(d.countryiso3code, {
              name: d.country.value,
              iso3: d.countryiso3code,
            });
          }
        }
        if (countryMap.size > 0) {
          const countryRows = Array.from(countryMap.values()).map((c) => ({
            country_code: c.iso3,
            country_name: c.name,
          }));
          const { error: metaError } = await supabase
            .from("wb_countries")
            .upsert(countryRows, { onConflict: "country_code", ignoreDuplicates: true });
          if (metaError) {
            log("warn", "Country metadata upsert failed (non-fatal)", {
              error: metaError.message,
            });
          }
        }

        const stats = await upsertIndicatorValues(data, supabase);

        totalStats.rows_inserted += stats.rows_inserted;
        totalStats.rows_updated += stats.rows_updated;
        totalStats.rows_skipped += stats.rows_skipped;
      } catch (indicatorErr) {
        log("error", "Failed to process indicator (continuing)", {
          indicator,
          error: (indicatorErr as Error).message,
        });
        // Continue with next indicator instead of failing the whole sync
      }
    }

    // Refresh materialized views
    log("info", "Refreshing materialized views", { runId });
    await supabase.rpc("refresh_wb_materialized_views");

    // Mark run as completed
    await supabase
      .from("wb_sync_runs")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
        rows_inserted: totalStats.rows_inserted,
        rows_updated: totalStats.rows_updated,
        rows_skipped: totalStats.rows_skipped,
      })
      .eq("run_id", runId);

    log("info", "Sync run completed", { runId, ...totalStats });

    return new Response(
      JSON.stringify({ run_id: runId, status: "completed", ...totalStats }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMsg = (err as Error).message;
    log("error", "Sync run failed", { runId, error: errorMsg });

    await supabase
      .from("wb_sync_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: errorMsg,
        rows_inserted: totalStats.rows_inserted,
        rows_updated: totalStats.rows_updated,
        rows_skipped: totalStats.rows_skipped,
      })
      .eq("run_id", runId);

    return new Response(
      JSON.stringify({ run_id: runId, status: "failed", error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
