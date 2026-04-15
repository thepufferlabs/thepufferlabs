-- ============================================================
-- Migration: Expand World Bank Analytics to Full Global Coverage
-- Date: 2026-04-16
-- Description:
--   - Expands wb_countries with new columns and seeds ~217 countries
--   - Expands wb_indicators with new columns and seeds 20+ indicators
--   - Creates crawl_batches, data_quality_checks tables
--   - Creates mv_indicator_coverage materialized view
--   - Creates RPC functions for reporting
--   - Adds RLS policies and indexes
-- ============================================================

-- ============================================================
-- 1. EXPAND wb_countries — add new columns
-- ============================================================
DO $$ BEGIN
    ALTER TABLE wb_countries ADD COLUMN iso2_code TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE wb_countries ADD COLUMN lending_type TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- capital_city, longitude, latitude already exist in the original schema
-- but we ensure they exist just in case
DO $$ BEGIN
    ALTER TABLE wb_countries ADD COLUMN capital_city TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE wb_countries ADD COLUMN longitude NUMERIC;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE wb_countries ADD COLUMN latitude NUMERIC;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================
-- 2. EXPAND wb_indicators — add new columns
-- ============================================================
DO $$ BEGIN
    ALTER TABLE wb_indicators ADD COLUMN category TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE wb_indicators ADD COLUMN frequency TEXT DEFAULT 'annual';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE wb_indicators ADD COLUMN source_note TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================
-- 3. SEED wb_countries — All ~217 World Bank countries
-- ============================================================

-- -------------------------------------------------------
-- East Asia & Pacific
-- -------------------------------------------------------
INSERT INTO wb_countries (code, name, region, income_level, iso2_code, capital_city, lending_type, longitude, latitude) VALUES
    ('ASM', 'American Samoa',                  'East Asia & Pacific', 'Upper middle income', 'AS', 'Pago Pago',        'Not classified', -170.7020, -14.2710),
    ('AUS', 'Australia',                        'East Asia & Pacific', 'High income',         'AU', 'Canberra',         'Not classified', 149.1300, -35.2820),
    ('BRN', 'Brunei Darussalam',               'East Asia & Pacific', 'High income',         'BN', 'Bandar Seri Begawan','Not classified', 114.9467, 4.9431),
    ('KHM', 'Cambodia',                         'East Asia & Pacific', 'Lower middle income', 'KH', 'Phnom Penh',       'IDA',            104.9160, 11.5625),
    ('CHN', 'China',                            'East Asia & Pacific', 'Upper middle income', 'CN', 'Beijing',          'IBRD',           116.2860, 40.0495),
    ('FJI', 'Fiji',                             'East Asia & Pacific', 'Upper middle income', 'FJ', 'Suva',             'IBRD',           178.4419, -18.1416),
    ('PYF', 'French Polynesia',                 'East Asia & Pacific', 'High income',         'PF', 'Papeete',          'Not classified', -149.5695, -17.5350),
    ('GUM', 'Guam',                             'East Asia & Pacific', 'High income',         'GU', 'Hagatna',          'Not classified', 144.7937, 13.4443),
    ('HKG', 'Hong Kong SAR, China',            'East Asia & Pacific', 'High income',         'HK', 'Hong Kong',        'Not classified', 114.1095, 22.3964),
    ('IDN', 'Indonesia',                        'East Asia & Pacific', 'Upper middle income', 'ID', 'Jakarta',          'IBRD',           106.8294, -6.1744),
    ('JPN', 'Japan',                            'East Asia & Pacific', 'High income',         'JP', 'Tokyo',            'Not classified', 139.7714, 35.6785),
    ('KIR', 'Kiribati',                         'East Asia & Pacific', 'Lower middle income', 'KI', 'Tarawa',           'IDA',            173.0178, 1.3278),
    ('PRK', 'Korea, Dem. People''s Rep.',       'East Asia & Pacific', 'Low income',          'KP', 'Pyongyang',        'Not classified', 125.7625, 39.0194),
    ('KOR', 'Korea, Rep.',                      'East Asia & Pacific', 'High income',         'KR', 'Seoul',            'Not classified', 126.9574, 37.5326),
    ('LAO', 'Lao PDR',                          'East Asia & Pacific', 'Lower middle income', 'LA', 'Vientiane',        'IDA',            102.6000, 17.9667),
    ('MAC', 'Macao SAR, China',                'East Asia & Pacific', 'High income',         'MO', 'Macao',            'Not classified', 113.5439, 22.1667),
    ('MYS', 'Malaysia',                         'East Asia & Pacific', 'Upper middle income', 'MY', 'Kuala Lumpur',     'IBRD',           101.6953, 3.1390),
    ('MHL', 'Marshall Islands',                 'East Asia & Pacific', 'Upper middle income', 'MH', 'Majuro',           'IDA',            171.3803, 7.1164),
    ('FSM', 'Micronesia, Fed. Sts.',           'East Asia & Pacific', 'Lower middle income', 'FM', 'Palikir',          'IDA',            158.1850, 6.9248),
    ('MNG', 'Mongolia',                         'East Asia & Pacific', 'Lower middle income', 'MN', 'Ulaanbaatar',      'Blend',          106.9057, 47.9077),
    ('MMR', 'Myanmar',                          'East Asia & Pacific', 'Lower middle income', 'MM', 'Naypyidaw',        'IDA',            96.1297,  19.7633),
    ('NRU', 'Nauru',                            'East Asia & Pacific', 'High income',         'NR', 'Yaren',            'IDA',            166.9210, -0.5477),
    ('NCL', 'New Caledonia',                    'East Asia & Pacific', 'High income',         'NC', 'Noumea',           'Not classified', 166.4572, -22.2677),
    ('NZL', 'New Zealand',                      'East Asia & Pacific', 'High income',         'NZ', 'Wellington',       'Not classified', 174.7756, -41.2924),
    ('MNP', 'Northern Mariana Islands',         'East Asia & Pacific', 'High income',         'MP', 'Saipan',           'Not classified', 145.7384, 15.1935),
    ('PLW', 'Palau',                            'East Asia & Pacific', 'High income',         'PW', 'Melekeok',         'IBRD',           134.6238, 7.5150),
    ('PNG', 'Papua New Guinea',                 'East Asia & Pacific', 'Lower middle income', 'PG', 'Port Moresby',     'Blend',          147.1925, -6.3148),
    ('PHL', 'Philippines',                      'East Asia & Pacific', 'Lower middle income', 'PH', 'Manila',           'IBRD',           120.9842, 14.5995),
    ('WSM', 'Samoa',                            'East Asia & Pacific', 'Lower middle income', 'WS', 'Apia',             'IDA',            -171.7514, -13.8333),
    ('SGP', 'Singapore',                        'East Asia & Pacific', 'High income',         'SG', 'Singapore',        'Not classified', 103.8520, 1.2929),
    ('SLB', 'Solomon Islands',                  'East Asia & Pacific', 'Lower middle income', 'SB', 'Honiara',          'IDA',            159.9498, -9.4431),
    ('THA', 'Thailand',                         'East Asia & Pacific', 'Upper middle income', 'TH', 'Bangkok',          'IBRD',           100.5218, 13.7563),
    ('TLS', 'Timor-Leste',                      'East Asia & Pacific', 'Lower middle income', 'TL', 'Dili',             'Blend',          125.5736, -8.5594),
    ('TON', 'Tonga',                            'East Asia & Pacific', 'Upper middle income', 'TO', 'Nuku''alofa',      'IDA',            -175.2026, -21.1360),
    ('TUV', 'Tuvalu',                           'East Asia & Pacific', 'Upper middle income', 'TV', 'Funafuti',         'IDA',            179.1940, -8.5167),
    ('VUT', 'Vanuatu',                          'East Asia & Pacific', 'Lower middle income', 'VU', 'Port Vila',        'IDA',            168.3219, -17.7404),
    ('VNM', 'Vietnam',                          'East Asia & Pacific', 'Lower middle income', 'VN', 'Hanoi',            'IBRD',           105.8342, 21.0278)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, region = EXCLUDED.region, income_level = EXCLUDED.income_level,
    iso2_code = EXCLUDED.iso2_code, capital_city = EXCLUDED.capital_city,
    lending_type = EXCLUDED.lending_type, longitude = EXCLUDED.longitude,
    latitude = EXCLUDED.latitude, updated_at = now();

-- -------------------------------------------------------
-- Europe & Central Asia
-- -------------------------------------------------------
INSERT INTO wb_countries (code, name, region, income_level, iso2_code, capital_city, lending_type, longitude, latitude) VALUES
    ('ALB', 'Albania',                          'Europe & Central Asia', 'Upper middle income', 'AL', 'Tirana',           'IBRD',           19.8187,  41.3275),
    ('AND', 'Andorra',                          'Europe & Central Asia', 'High income',         'AD', 'Andorra la Vella', 'Not classified', 1.5218,   42.5063),
    ('ARM', 'Armenia',                          'Europe & Central Asia', 'Upper middle income', 'AM', 'Yerevan',          'IBRD',           44.5126,  40.1772),
    ('AUT', 'Austria',                          'Europe & Central Asia', 'High income',         'AT', 'Vienna',           'Not classified', 16.3798,  48.2082),
    ('AZE', 'Azerbaijan',                       'Europe & Central Asia', 'Upper middle income', 'AZ', 'Baku',             'IBRD',           49.8671,  40.4093),
    ('BLR', 'Belarus',                          'Europe & Central Asia', 'Upper middle income', 'BY', 'Minsk',            'IBRD',           27.5766,  53.9006),
    ('BEL', 'Belgium',                          'Europe & Central Asia', 'High income',         'BE', 'Brussels',         'Not classified', 4.3676,   50.8333),
    ('BIH', 'Bosnia and Herzegovina',           'Europe & Central Asia', 'Upper middle income', 'BA', 'Sarajevo',         'IBRD',           18.4131,  43.8608),
    ('BGR', 'Bulgaria',                         'Europe & Central Asia', 'Upper middle income', 'BG', 'Sofia',            'IBRD',           23.3219,  42.7105),
    ('HRV', 'Croatia',                          'Europe & Central Asia', 'High income',         'HR', 'Zagreb',           'Not classified', 15.9780,  45.8150),
    ('CYP', 'Cyprus',                           'Europe & Central Asia', 'High income',         'CY', 'Nicosia',         'Not classified', 33.3642,  35.1676),
    ('CZE', 'Czech Republic',                   'Europe & Central Asia', 'High income',         'CZ', 'Prague',           'Not classified', 14.4378,  50.0755),
    ('DNK', 'Denmark',                          'Europe & Central Asia', 'High income',         'DK', 'Copenhagen',       'Not classified', 12.5683,  55.6761),
    ('EST', 'Estonia',                          'Europe & Central Asia', 'High income',         'EE', 'Tallinn',          'Not classified', 24.7281,  59.4339),
    ('FRO', 'Faroe Islands',                    'Europe & Central Asia', 'High income',         'FO', 'Torshavn',         'Not classified', -6.7714,  62.0000),
    ('FIN', 'Finland',                          'Europe & Central Asia', 'High income',         'FI', 'Helsinki',         'Not classified', 24.9354,  60.1756),
    ('FRA', 'France',                           'Europe & Central Asia', 'High income',         'FR', 'Paris',            'Not classified', 2.3508,   48.8566),
    ('GEO', 'Georgia',                          'Europe & Central Asia', 'Upper middle income', 'GE', 'Tbilisi',          'IBRD',           44.8271,  41.7151),
    ('DEU', 'Germany',                          'Europe & Central Asia', 'High income',         'DE', 'Berlin',           'Not classified', 13.4050,  52.5200),
    ('GIB', 'Gibraltar',                        'Europe & Central Asia', 'High income',         'GI', 'Gibraltar',        'Not classified', -5.3526,  36.1408),
    ('GRC', 'Greece',                           'Europe & Central Asia', 'High income',         'GR', 'Athens',           'Not classified', 23.7162,  37.9795),
    ('GRL', 'Greenland',                        'Europe & Central Asia', 'High income',         'GL', 'Nuuk',             'Not classified', -51.7214, 64.1814),
    ('HUN', 'Hungary',                          'Europe & Central Asia', 'High income',         'HU', 'Budapest',         'Not classified', 19.0402,  47.4979),
    ('ISL', 'Iceland',                          'Europe & Central Asia', 'High income',         'IS', 'Reykjavik',        'Not classified', -21.8952, 64.1353),
    ('IRL', 'Ireland',                          'Europe & Central Asia', 'High income',         'IE', 'Dublin',           'Not classified', -6.2603,  53.3498),
    ('IMN', 'Isle of Man',                      'Europe & Central Asia', 'High income',         'IM', 'Douglas',          'Not classified', -4.4821,  54.1523),
    ('ITA', 'Italy',                            'Europe & Central Asia', 'High income',         'IT', 'Rome',             'Not classified', 12.4964,  41.9028),
    ('KAZ', 'Kazakhstan',                       'Europe & Central Asia', 'Upper middle income', 'KZ', 'Astana',           'IBRD',           71.4491,  51.1605),
    ('XKX', 'Kosovo',                           'Europe & Central Asia', 'Upper middle income', 'XK', 'Pristina',         'IBRD',           21.1655,  42.6629),
    ('KGZ', 'Kyrgyz Republic',                  'Europe & Central Asia', 'Lower middle income', 'KG', 'Bishkek',          'IDA',            74.5698,  42.8746),
    ('LVA', 'Latvia',                           'Europe & Central Asia', 'High income',         'LV', 'Riga',             'Not classified', 24.1052,  56.9496),
    ('LIE', 'Liechtenstein',                    'Europe & Central Asia', 'High income',         'LI', 'Vaduz',            'Not classified', 9.5215,   47.1410),
    ('LTU', 'Lithuania',                        'Europe & Central Asia', 'High income',         'LT', 'Vilnius',          'Not classified', 25.2798,  54.6872),
    ('LUX', 'Luxembourg',                       'Europe & Central Asia', 'High income',         'LU', 'Luxembourg',       'Not classified', 6.1300,   49.6117),
    ('MKD', 'North Macedonia',                  'Europe & Central Asia', 'Upper middle income', 'MK', 'Skopje',           'IBRD',           21.4254,  42.0000),
    ('MDA', 'Moldova',                          'Europe & Central Asia', 'Lower middle income', 'MD', 'Chisinau',         'Blend',          28.8353,  47.0056),
    ('MCO', 'Monaco',                           'Europe & Central Asia', 'High income',         'MC', 'Monaco',           'Not classified', 7.4167,   43.7333),
    ('MNE', 'Montenegro',                       'Europe & Central Asia', 'Upper middle income', 'ME', 'Podgorica',        'IBRD',           19.2594,  42.4602),
    ('NLD', 'Netherlands',                      'Europe & Central Asia', 'High income',         'NL', 'Amsterdam',        'Not classified', 4.8952,   52.3702),
    ('NOR', 'Norway',                           'Europe & Central Asia', 'High income',         'NO', 'Oslo',             'Not classified', 10.7522,  59.9139),
    ('POL', 'Poland',                           'Europe & Central Asia', 'High income',         'PL', 'Warsaw',           'Not classified', 21.0175,  52.2297),
    ('PRT', 'Portugal',                         'Europe & Central Asia', 'High income',         'PT', 'Lisbon',           'Not classified', -9.1393,  38.7223),
    ('ROU', 'Romania',                          'Europe & Central Asia', 'High income',         'RO', 'Bucharest',        'IBRD',           26.0963,  44.4268),
    ('RUS', 'Russian Federation',               'Europe & Central Asia', 'Upper middle income', 'RU', 'Moscow',           'IBRD',           37.6173,  55.7558),
    ('SMR', 'San Marino',                       'Europe & Central Asia', 'High income',         'SM', 'San Marino',       'Not classified', 12.4418,  43.9424),
    ('SRB', 'Serbia',                           'Europe & Central Asia', 'Upper middle income', 'RS', 'Belgrade',         'IBRD',           20.4651,  44.7866),
    ('SVK', 'Slovak Republic',                  'Europe & Central Asia', 'High income',         'SK', 'Bratislava',       'Not classified', 17.1077,  48.1486),
    ('SVN', 'Slovenia',                         'Europe & Central Asia', 'High income',         'SI', 'Ljubljana',        'Not classified', 14.5058,  46.0511),
    ('ESP', 'Spain',                            'Europe & Central Asia', 'High income',         'ES', 'Madrid',           'Not classified', -3.7038,  40.4168),
    ('SWE', 'Sweden',                           'Europe & Central Asia', 'High income',         'SE', 'Stockholm',        'Not classified', 18.0686,  59.3293),
    ('CHE', 'Switzerland',                      'Europe & Central Asia', 'High income',         'CH', 'Bern',             'Not classified', 7.4474,   46.9480),
    ('TJK', 'Tajikistan',                       'Europe & Central Asia', 'Lower middle income', 'TJ', 'Dushanbe',         'IDA',            68.7740,  38.5737),
    ('TUR', 'Turkiye',                          'Europe & Central Asia', 'Upper middle income', 'TR', 'Ankara',           'IBRD',           32.8597,  39.9334),
    ('TKM', 'Turkmenistan',                     'Europe & Central Asia', 'Upper middle income', 'TM', 'Ashgabat',         'IBRD',           58.3833,  37.9500),
    ('UKR', 'Ukraine',                          'Europe & Central Asia', 'Lower middle income', 'UA', 'Kyiv',             'IBRD',           30.5234,  50.4501),
    ('GBR', 'United Kingdom',                   'Europe & Central Asia', 'High income',         'GB', 'London',           'Not classified', -0.1276,  51.5074),
    ('UZB', 'Uzbekistan',                       'Europe & Central Asia', 'Lower middle income', 'UZ', 'Tashkent',         'Blend',          69.2401,  41.2995)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, region = EXCLUDED.region, income_level = EXCLUDED.income_level,
    iso2_code = EXCLUDED.iso2_code, capital_city = EXCLUDED.capital_city,
    lending_type = EXCLUDED.lending_type, longitude = EXCLUDED.longitude,
    latitude = EXCLUDED.latitude, updated_at = now();

-- -------------------------------------------------------
-- Latin America & Caribbean
-- -------------------------------------------------------
INSERT INTO wb_countries (code, name, region, income_level, iso2_code, capital_city, lending_type, longitude, latitude) VALUES
    ('ARG', 'Argentina',                        'Latin America & Caribbean', 'Upper middle income', 'AR', 'Buenos Aires',     'IBRD',           -58.3816, -34.6037),
    ('ABW', 'Aruba',                            'Latin America & Caribbean', 'High income',         'AW', 'Oranjestad',       'Not classified', -69.9683, 12.5186),
    ('BHS', 'Bahamas, The',                     'Latin America & Caribbean', 'High income',         'BS', 'Nassau',           'Not classified', -77.3500, 25.0480),
    ('BRB', 'Barbados',                         'Latin America & Caribbean', 'High income',         'BB', 'Bridgetown',       'Not classified', -59.6105, 13.0969),
    ('BLZ', 'Belize',                           'Latin America & Caribbean', 'Upper middle income', 'BZ', 'Belmopan',         'IBRD',           -88.7667, 17.2510),
    ('BOL', 'Bolivia',                          'Latin America & Caribbean', 'Lower middle income', 'BO', 'La Paz',           'Blend',          -68.1193, -16.4897),
    ('BRA', 'Brazil',                           'Latin America & Caribbean', 'Upper middle income', 'BR', 'Brasilia',         'IBRD',           -47.8825, -15.7942),
    ('VGB', 'British Virgin Islands',           'Latin America & Caribbean', 'High income',         'VG', 'Road Town',        'Not classified', -64.6208, 18.4286),
    ('CYM', 'Cayman Islands',                   'Latin America & Caribbean', 'High income',         'KY', 'George Town',      'Not classified', -81.3744, 19.2866),
    ('CHL', 'Chile',                            'Latin America & Caribbean', 'High income',         'CL', 'Santiago',         'Not classified', -70.6693, -33.4489),
    ('COL', 'Colombia',                         'Latin America & Caribbean', 'Upper middle income', 'CO', 'Bogota',           'IBRD',           -74.0721, 4.7110),
    ('CRI', 'Costa Rica',                       'Latin America & Caribbean', 'Upper middle income', 'CR', 'San Jose',         'IBRD',           -84.0907, 9.9281),
    ('CUB', 'Cuba',                             'Latin America & Caribbean', 'Upper middle income', 'CU', 'Havana',           'Not classified', -82.3667, 23.1136),
    ('CUW', 'Curacao',                          'Latin America & Caribbean', 'High income',         'CW', 'Willemstad',       'Not classified', -68.9335, 12.1696),
    ('DMA', 'Dominica',                         'Latin America & Caribbean', 'Upper middle income', 'DM', 'Roseau',           'Blend',          -61.3794, 15.2976),
    ('DOM', 'Dominican Republic',               'Latin America & Caribbean', 'Upper middle income', 'DO', 'Santo Domingo',    'IBRD',           -69.9312, 18.4861),
    ('ECU', 'Ecuador',                          'Latin America & Caribbean', 'Upper middle income', 'EC', 'Quito',            'IBRD',           -78.5167, -0.2150),
    ('SLV', 'El Salvador',                      'Latin America & Caribbean', 'Lower middle income', 'SV', 'San Salvador',     'IBRD',           -89.2182, 13.6989),
    ('GRD', 'Grenada',                          'Latin America & Caribbean', 'Upper middle income', 'GD', 'St. George''s',    'Blend',          -61.7524, 12.0561),
    ('GTM', 'Guatemala',                        'Latin America & Caribbean', 'Upper middle income', 'GT', 'Guatemala City',   'IBRD',           -90.5069, 14.6349),
    ('GUY', 'Guyana',                           'Latin America & Caribbean', 'Upper middle income', 'GY', 'Georgetown',       'IDA',            -58.1551, 6.8013),
    ('HTI', 'Haiti',                            'Latin America & Caribbean', 'Lower middle income', 'HT', 'Port-au-Prince',   'IDA',            -72.3288, 18.5425),
    ('HND', 'Honduras',                         'Latin America & Caribbean', 'Lower middle income', 'HN', 'Tegucigalpa',      'IDA',            -87.2068, 14.0723),
    ('JAM', 'Jamaica',                          'Latin America & Caribbean', 'Upper middle income', 'JM', 'Kingston',         'IBRD',           -76.7936, 17.9714),
    ('MEX', 'Mexico',                           'Latin America & Caribbean', 'Upper middle income', 'MX', 'Mexico City',      'IBRD',           -99.1332, 19.4326),
    ('NIC', 'Nicaragua',                        'Latin America & Caribbean', 'Lower middle income', 'NI', 'Managua',          'IDA',            -86.2362, 12.1150),
    ('PAN', 'Panama',                           'Latin America & Caribbean', 'High income',         'PA', 'Panama City',      'IBRD',           -79.5168, 8.9936),
    ('PRY', 'Paraguay',                         'Latin America & Caribbean', 'Upper middle income', 'PY', 'Asuncion',         'IBRD',           -57.5759, -25.2637),
    ('PER', 'Peru',                             'Latin America & Caribbean', 'Upper middle income', 'PE', 'Lima',             'IBRD',           -77.0428, -12.0464),
    ('PRI', 'Puerto Rico',                      'Latin America & Caribbean', 'High income',         'PR', 'San Juan',         'Not classified', -66.1057, 18.4655),
    ('SXM', 'Sint Maarten (Dutch part)',        'Latin America & Caribbean', 'High income',         'SX', 'Philipsburg',      'Not classified', -63.0458, 18.0292),
    ('KNA', 'St. Kitts and Nevis',             'Latin America & Caribbean', 'High income',         'KN', 'Basseterre',       'IBRD',           -62.7177, 17.2948),
    ('LCA', 'St. Lucia',                        'Latin America & Caribbean', 'Upper middle income', 'LC', 'Castries',         'Blend',          -61.0003, 14.0101),
    ('MAF', 'St. Martin (French part)',         'Latin America & Caribbean', 'High income',         'MF', 'Marigot',          'Not classified', -63.0827, 18.0731),
    ('VCT', 'St. Vincent and the Grenadines',  'Latin America & Caribbean', 'Upper middle income', 'VC', 'Kingstown',        'Blend',          -61.2277, 13.1600),
    ('SUR', 'Suriname',                         'Latin America & Caribbean', 'Upper middle income', 'SR', 'Paramaribo',       'IBRD',           -55.1679, 5.8520),
    ('TTO', 'Trinidad and Tobago',              'Latin America & Caribbean', 'High income',         'TT', 'Port of Spain',    'Not classified', -61.5167, 10.6667),
    ('TCA', 'Turks and Caicos Islands',        'Latin America & Caribbean', 'High income',         'TC', 'Grand Turk',       'Not classified', -71.1389, 21.4612),
    ('URY', 'Uruguay',                          'Latin America & Caribbean', 'High income',         'UY', 'Montevideo',       'Not classified', -56.1645, -34.9011),
    ('VEN', 'Venezuela, RB',                    'Latin America & Caribbean', 'Upper middle income', 'VE', 'Caracas',          'IBRD',           -66.9036, 10.4806),
    ('VIR', 'Virgin Islands (U.S.)',           'Latin America & Caribbean', 'High income',         'VI', 'Charlotte Amalie', 'Not classified', -64.8963, 18.3358)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, region = EXCLUDED.region, income_level = EXCLUDED.income_level,
    iso2_code = EXCLUDED.iso2_code, capital_city = EXCLUDED.capital_city,
    lending_type = EXCLUDED.lending_type, longitude = EXCLUDED.longitude,
    latitude = EXCLUDED.latitude, updated_at = now();

-- -------------------------------------------------------
-- Middle East & North Africa
-- -------------------------------------------------------
INSERT INTO wb_countries (code, name, region, income_level, iso2_code, capital_city, lending_type, longitude, latitude) VALUES
    ('DZA', 'Algeria',                          'Middle East & North Africa', 'Lower middle income', 'DZ', 'Algiers',          'IBRD',           3.0588,   36.7538),
    ('BHR', 'Bahrain',                          'Middle East & North Africa', 'High income',         'BH', 'Manama',           'Not classified', 50.5577,  26.2285),
    ('DJI', 'Djibouti',                         'Middle East & North Africa', 'Lower middle income', 'DJ', 'Djibouti',         'IDA',            43.1456,  11.5721),
    ('EGY', 'Egypt, Arab Rep.',                 'Middle East & North Africa', 'Lower middle income', 'EG', 'Cairo',            'IBRD',           31.2357,  30.0444),
    ('IRN', 'Iran, Islamic Rep.',               'Middle East & North Africa', 'Lower middle income', 'IR', 'Tehran',           'IBRD',           51.3890,  35.6892),
    ('IRQ', 'Iraq',                             'Middle East & North Africa', 'Upper middle income', 'IQ', 'Baghdad',          'IBRD',           44.3615,  33.3128),
    ('ISR', 'Israel',                           'Middle East & North Africa', 'High income',         'IL', 'Jerusalem',        'Not classified', 35.2137,  31.7683),
    ('JOR', 'Jordan',                           'Middle East & North Africa', 'Upper middle income', 'JO', 'Amman',            'IBRD',           35.9106,  31.9454),
    ('KWT', 'Kuwait',                           'Middle East & North Africa', 'High income',         'KW', 'Kuwait City',      'Not classified', 47.9783,  29.3759),
    ('LBN', 'Lebanon',                          'Middle East & North Africa', 'Lower middle income', 'LB', 'Beirut',           'IBRD',           35.5018,  33.8938),
    ('LBY', 'Libya',                            'Middle East & North Africa', 'Upper middle income', 'LY', 'Tripoli',          'IBRD',           13.1807,  32.8872),
    ('MLT', 'Malta',                            'Middle East & North Africa', 'High income',         'MT', 'Valletta',         'Not classified', 14.5074,  35.8989),
    ('MAR', 'Morocco',                          'Middle East & North Africa', 'Lower middle income', 'MA', 'Rabat',            'IBRD',           -6.8498,  33.9716),
    ('OMN', 'Oman',                             'Middle East & North Africa', 'High income',         'OM', 'Muscat',           'Not classified', 58.5400,  23.6100),
    ('QAT', 'Qatar',                            'Middle East & North Africa', 'High income',         'QA', 'Doha',             'Not classified', 51.5310,  25.2854),
    ('SAU', 'Saudi Arabia',                     'Middle East & North Africa', 'High income',         'SA', 'Riyadh',           'Not classified', 46.6753,  24.7136),
    ('SYR', 'Syrian Arab Republic',             'Middle East & North Africa', 'Low income',          'SY', 'Damascus',         'IBRD',           36.2765,  33.5138),
    ('TUN', 'Tunisia',                          'Middle East & North Africa', 'Lower middle income', 'TN', 'Tunis',            'IBRD',           10.1815,  36.8065),
    ('ARE', 'United Arab Emirates',             'Middle East & North Africa', 'High income',         'AE', 'Abu Dhabi',        'Not classified', 54.3773,  24.4539),
    ('PSE', 'West Bank and Gaza',              'Middle East & North Africa', 'Lower middle income', 'PS', 'Ramallah',         'Not classified', 35.2332,  31.9522),
    ('YEM', 'Yemen, Rep.',                      'Middle East & North Africa', 'Low income',          'YE', 'Sana''a',          'IDA',            44.2075,  15.3694)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, region = EXCLUDED.region, income_level = EXCLUDED.income_level,
    iso2_code = EXCLUDED.iso2_code, capital_city = EXCLUDED.capital_city,
    lending_type = EXCLUDED.lending_type, longitude = EXCLUDED.longitude,
    latitude = EXCLUDED.latitude, updated_at = now();

-- -------------------------------------------------------
-- North America
-- -------------------------------------------------------
INSERT INTO wb_countries (code, name, region, income_level, iso2_code, capital_city, lending_type, longitude, latitude) VALUES
    ('BMU', 'Bermuda',                          'North America', 'High income', 'BM', 'Hamilton',       'Not classified', -64.7505, 32.2949),
    ('CAN', 'Canada',                           'North America', 'High income', 'CA', 'Ottawa',         'Not classified', -75.6972, 45.4215),
    ('USA', 'United States',                    'North America', 'High income', 'US', 'Washington D.C.','Not classified', -77.0369, 38.9072)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, region = EXCLUDED.region, income_level = EXCLUDED.income_level,
    iso2_code = EXCLUDED.iso2_code, capital_city = EXCLUDED.capital_city,
    lending_type = EXCLUDED.lending_type, longitude = EXCLUDED.longitude,
    latitude = EXCLUDED.latitude, updated_at = now();

-- -------------------------------------------------------
-- South Asia
-- -------------------------------------------------------
INSERT INTO wb_countries (code, name, region, income_level, iso2_code, capital_city, lending_type, longitude, latitude) VALUES
    ('AFG', 'Afghanistan',                      'South Asia', 'Low income',          'AF', 'Kabul',          'IDA',            69.1723,  34.5553),
    ('BGD', 'Bangladesh',                       'South Asia', 'Lower middle income', 'BD', 'Dhaka',          'IDA',            90.4074,  23.8103),
    ('BTN', 'Bhutan',                           'South Asia', 'Lower middle income', 'BT', 'Thimphu',        'IDA',            89.6419,  27.4728),
    ('IND', 'India',                            'South Asia', 'Lower middle income', 'IN', 'New Delhi',      'IBRD',           77.2090,  28.6139),
    ('MDV', 'Maldives',                         'South Asia', 'Upper middle income', 'MV', 'Male',           'IDA',            73.5093,  4.1755),
    ('NPL', 'Nepal',                            'South Asia', 'Lower middle income', 'NP', 'Kathmandu',      'IDA',            85.3240,  27.7172),
    ('PAK', 'Pakistan',                         'South Asia', 'Lower middle income', 'PK', 'Islamabad',      'Blend',          73.0479,  33.6844),
    ('LKA', 'Sri Lanka',                        'South Asia', 'Lower middle income', 'LK', 'Colombo',        'IBRD',           79.8612,  6.9271)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, region = EXCLUDED.region, income_level = EXCLUDED.income_level,
    iso2_code = EXCLUDED.iso2_code, capital_city = EXCLUDED.capital_city,
    lending_type = EXCLUDED.lending_type, longitude = EXCLUDED.longitude,
    latitude = EXCLUDED.latitude, updated_at = now();

-- -------------------------------------------------------
-- Sub-Saharan Africa
-- -------------------------------------------------------
INSERT INTO wb_countries (code, name, region, income_level, iso2_code, capital_city, lending_type, longitude, latitude) VALUES
    ('AGO', 'Angola',                           'Sub-Saharan Africa', 'Lower middle income', 'AO', 'Luanda',           'IBRD',           13.2343,  -8.8399),
    ('BEN', 'Benin',                            'Sub-Saharan Africa', 'Lower middle income', 'BJ', 'Porto-Novo',       'IDA',            2.6166,   6.4969),
    ('BWA', 'Botswana',                         'Sub-Saharan Africa', 'Upper middle income', 'BW', 'Gaborone',         'IBRD',           25.9201,  -24.6282),
    ('BFA', 'Burkina Faso',                     'Sub-Saharan Africa', 'Low income',          'BF', 'Ouagadougou',      'IDA',            -1.5197,  12.3714),
    ('BDI', 'Burundi',                          'Sub-Saharan Africa', 'Low income',          'BI', 'Gitega',           'IDA',            29.9189,  -3.4264),
    ('CPV', 'Cabo Verde',                       'Sub-Saharan Africa', 'Lower middle income', 'CV', 'Praia',            'Blend',          -23.5087, 14.9331),
    ('CMR', 'Cameroon',                         'Sub-Saharan Africa', 'Lower middle income', 'CM', 'Yaounde',          'Blend',          11.5021,  3.8480),
    ('CAF', 'Central African Republic',         'Sub-Saharan Africa', 'Low income',          'CF', 'Bangui',           'IDA',            18.5582,  4.3947),
    ('TCD', 'Chad',                             'Sub-Saharan Africa', 'Low income',          'TD', 'N''Djamena',       'IDA',            15.0557,  12.1348),
    ('COM', 'Comoros',                          'Sub-Saharan Africa', 'Lower middle income', 'KM', 'Moroni',           'IDA',            43.2551,  -11.7022),
    ('COD', 'Congo, Dem. Rep.',                 'Sub-Saharan Africa', 'Low income',          'CD', 'Kinshasa',         'IDA',            15.2663,  -4.4419),
    ('COG', 'Congo, Rep.',                      'Sub-Saharan Africa', 'Lower middle income', 'CG', 'Brazzaville',      'Blend',          15.2832,  -4.2634),
    ('CIV', 'Cote d''Ivoire',                  'Sub-Saharan Africa', 'Lower middle income', 'CI', 'Yamoussoukro',     'IDA',            -5.2767,  6.8276),
    ('ERI', 'Eritrea',                          'Sub-Saharan Africa', 'Low income',          'ER', 'Asmara',           'IDA',            38.9318,  15.3229),
    ('SWZ', 'Eswatini',                         'Sub-Saharan Africa', 'Lower middle income', 'SZ', 'Mbabane',          'IBRD',           31.1367,  -26.3054),
    ('ETH', 'Ethiopia',                         'Sub-Saharan Africa', 'Low income',          'ET', 'Addis Ababa',      'IDA',            38.7468,  9.0227),
    ('GAB', 'Gabon',                            'Sub-Saharan Africa', 'Upper middle income', 'GA', 'Libreville',       'IBRD',           9.4536,   0.3924),
    ('GMB', 'Gambia, The',                      'Sub-Saharan Africa', 'Low income',          'GM', 'Banjul',           'IDA',            -16.5775, 13.4432),
    ('GHA', 'Ghana',                            'Sub-Saharan Africa', 'Lower middle income', 'GH', 'Accra',            'IDA',            -0.1870,  5.6037),
    ('GIN', 'Guinea',                           'Sub-Saharan Africa', 'Low income',          'GN', 'Conakry',          'IDA',            -13.5784, 9.6412),
    ('GNB', 'Guinea-Bissau',                    'Sub-Saharan Africa', 'Low income',          'GW', 'Bissau',           'IDA',            -15.5980, 11.8037),
    ('KEN', 'Kenya',                            'Sub-Saharan Africa', 'Lower middle income', 'KE', 'Nairobi',          'Blend',          36.8219,  -1.2921),
    ('LSO', 'Lesotho',                          'Sub-Saharan Africa', 'Lower middle income', 'LS', 'Maseru',           'IDA',            27.4833,  -29.3167),
    ('LBR', 'Liberia',                          'Sub-Saharan Africa', 'Low income',          'LR', 'Monrovia',         'IDA',            -10.8047, 6.3156),
    ('MDG', 'Madagascar',                       'Sub-Saharan Africa', 'Low income',          'MG', 'Antananarivo',     'IDA',            47.5079,  -18.8792),
    ('MWI', 'Malawi',                           'Sub-Saharan Africa', 'Low income',          'MW', 'Lilongwe',         'IDA',            33.7741,  -13.9626),
    ('MLI', 'Mali',                             'Sub-Saharan Africa', 'Low income',          'ML', 'Bamako',           'IDA',            -8.0029,  12.6392),
    ('MRT', 'Mauritania',                       'Sub-Saharan Africa', 'Lower middle income', 'MR', 'Nouakchott',       'IDA',            -15.9785, 18.0735),
    ('MUS', 'Mauritius',                        'Sub-Saharan Africa', 'Upper middle income', 'MU', 'Port Louis',       'IBRD',           57.5012,  -20.1609),
    ('MOZ', 'Mozambique',                       'Sub-Saharan Africa', 'Low income',          'MZ', 'Maputo',           'IDA',            32.5892,  -25.9692),
    ('NAM', 'Namibia',                          'Sub-Saharan Africa', 'Upper middle income', 'NA', 'Windhoek',         'IBRD',           17.0658,  -22.5609),
    ('NER', 'Niger',                            'Sub-Saharan Africa', 'Low income',          'NE', 'Niamey',           'IDA',            2.1098,   13.5137),
    ('NGA', 'Nigeria',                          'Sub-Saharan Africa', 'Lower middle income', 'NG', 'Abuja',            'Blend',          7.4951,   9.0579),
    ('RWA', 'Rwanda',                           'Sub-Saharan Africa', 'Low income',          'RW', 'Kigali',           'IDA',            29.8739,  -1.9403),
    ('STP', 'Sao Tome and Principe',           'Sub-Saharan Africa', 'Lower middle income', 'ST', 'Sao Tome',         'IDA',            6.6131,   0.1864),
    ('SEN', 'Senegal',                          'Sub-Saharan Africa', 'Lower middle income', 'SN', 'Dakar',            'IDA',            -17.4467, 14.7167),
    ('SYC', 'Seychelles',                       'Sub-Saharan Africa', 'High income',         'SC', 'Victoria',         'IBRD',           55.4513,  -4.6191),
    ('SLE', 'Sierra Leone',                     'Sub-Saharan Africa', 'Low income',          'SL', 'Freetown',         'IDA',            -13.2317, 8.4657),
    ('SOM', 'Somalia',                          'Sub-Saharan Africa', 'Low income',          'SO', 'Mogadishu',        'IDA',            45.3182,  2.0469),
    ('ZAF', 'South Africa',                     'Sub-Saharan Africa', 'Upper middle income', 'ZA', 'Pretoria',         'IBRD',           28.1871,  -25.7479),
    ('SSD', 'South Sudan',                      'Sub-Saharan Africa', 'Low income',          'SS', 'Juba',             'IDA',            31.5825,  4.8517),
    ('SDN', 'Sudan',                            'Sub-Saharan Africa', 'Low income',          'SD', 'Khartoum',         'IDA',            32.5599,  15.5007),
    ('TZA', 'Tanzania',                         'Sub-Saharan Africa', 'Lower middle income', 'TZ', 'Dodoma',           'IDA',            35.7516,  -6.1630),
    ('TGO', 'Togo',                             'Sub-Saharan Africa', 'Low income',          'TG', 'Lome',             'IDA',            1.2255,   6.1256),
    ('UGA', 'Uganda',                           'Sub-Saharan Africa', 'Low income',          'UG', 'Kampala',          'IDA',            32.5825,  0.3476),
    ('ZMB', 'Zambia',                           'Sub-Saharan Africa', 'Lower middle income', 'ZM', 'Lusaka',           'IDA',            28.2826,  -15.3875),
    ('ZWE', 'Zimbabwe',                         'Sub-Saharan Africa', 'Lower middle income', 'ZW', 'Harare',           'Blend',          31.0492,  -17.8216)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, region = EXCLUDED.region, income_level = EXCLUDED.income_level,
    iso2_code = EXCLUDED.iso2_code, capital_city = EXCLUDED.capital_city,
    lending_type = EXCLUDED.lending_type, longitude = EXCLUDED.longitude,
    latitude = EXCLUDED.latitude, updated_at = now();

-- ============================================================
-- 4. SEED wb_indicators — 20+ indicators across all categories
-- ============================================================
INSERT INTO wb_indicators (code, name, description, category, frequency, source_note) VALUES
    -- GDP & Economy
    ('NY.GDP.MKTP.CD',    'GDP (current US$)',
     'Gross domestic product at purchaser''s prices, current US dollars.',
     'GDP & Economy', 'annual',
     'World Bank national accounts data, and OECD National Accounts data files.'),

    ('NY.GDP.MKTP.KD.ZG', 'GDP growth (annual %)',
     'Annual percentage growth rate of GDP at market prices based on constant local currency.',
     'GDP & Economy', 'annual',
     'World Bank national accounts data, and OECD National Accounts data files.'),

    ('NY.GDP.PCAP.CD',    'GDP per capita (current US$)',
     'GDP per capita is gross domestic product divided by midyear population.',
     'GDP & Economy', 'annual',
     'World Bank national accounts data, and OECD National Accounts data files.'),

    ('NY.GDP.PCAP.KD.ZG', 'GDP per capita growth (annual %)',
     'Annual percentage growth rate of GDP per capita based on constant local currency.',
     'GDP & Economy', 'annual',
     'World Bank national accounts data, and OECD National Accounts data files.'),

    -- Inflation
    ('FP.CPI.TOTL.ZG',    'Inflation, consumer prices (annual %)',
     'Inflation as measured by the consumer price index reflects the annual percentage change in the cost to the average consumer.',
     'Inflation', 'annual',
     'International Monetary Fund, International Financial Statistics and data files.'),

    -- Trade
    ('NE.TRD.GNFS.ZS',    'Trade (% of GDP)',
     'Trade is the sum of exports and imports of goods and services measured as a share of gross domestic product.',
     'Trade', 'annual',
     'World Bank national accounts data, and OECD National Accounts data files.'),

    ('BX.KLT.DINV.CD.WD', 'Foreign direct investment, net inflows (BoP, current US$)',
     'Foreign direct investment refers to direct investment equity flows in the reporting economy.',
     'Trade', 'annual',
     'International Monetary Fund, Balance of Payments database.'),

    -- Employment
    ('SL.UEM.TOTL.ZS',    'Unemployment, total (% of total labor force) (modeled ILO estimate)',
     'Unemployment refers to the share of the labor force that is without work but available and seeking employment.',
     'Employment', 'annual',
     'International Labour Organization, ILOSTAT database.'),

    ('SL.TLF.CACT.ZS',    'Labor force participation rate, total (% of total population ages 15+) (modeled ILO estimate)',
     'Labor force participation rate is the proportion of the population ages 15 and older that is economically active.',
     'Employment', 'annual',
     'International Labour Organization, ILOSTAT database.'),

    -- Population
    ('SP.POP.TOTL',        'Population, total',
     'Total population is based on the de facto definition of population, which counts all residents regardless of legal status or citizenship.',
     'Population', 'annual',
     'United Nations Population Division, World Population Prospects.'),

    ('SP.POP.GROW',        'Population growth (annual %)',
     'Annual population growth rate. Population is based on the de facto definition.',
     'Population', 'annual',
     'Derived from total population. United Nations Population Division.'),

    ('SP.URB.TOTL.IN.ZS',  'Urban population (% of total population)',
     'Urban population refers to people living in urban areas as defined by national statistical offices.',
     'Population', 'annual',
     'United Nations Population Division, World Urbanization Prospects.'),

    -- Health
    ('SP.DYN.LE00.IN',    'Life expectancy at birth, total (years)',
     'Life expectancy at birth indicates the number of years a newborn infant would live if prevailing patterns of mortality at the time of its birth were to stay the same.',
     'Health', 'annual',
     'Derived from male and female life expectancy at birth. United Nations Population Division.'),

    ('SH.XPD.CHEX.GD.ZS', 'Current health expenditure (% of GDP)',
     'Level of current health expenditure expressed as a percentage of GDP.',
     'Health', 'annual',
     'World Health Organization Global Health Expenditure database.'),

    -- Education
    ('SE.ADT.LITR.ZS',    'Literacy rate, adult total (% of people ages 15 and above)',
     'Adult literacy rate is the percentage of people ages 15 and above who can both read and write with understanding a short simple statement.',
     'Education', 'annual',
     'UNESCO Institute for Statistics.'),

    ('SE.XPD.TOTL.GD.ZS', 'Government expenditure on education, total (% of GDP)',
     'General government expenditure on education (current, capital, and transfers) as a percentage of GDP.',
     'Education', 'annual',
     'UNESCO Institute for Statistics.'),

    -- Infrastructure
    ('EG.USE.ELEC.KH.PC', 'Electric power consumption (kWh per capita)',
     'Electric power consumption measures the production of power plants and combined heat and power plants less transmission, distribution, and transformation losses and own use by heat and power plants.',
     'Infrastructure', 'annual',
     'IEA Statistics, OECD/IEA.'),

    ('IT.NET.USER.ZS',    'Individuals using the Internet (% of population)',
     'Internet users are individuals who have used the Internet in the last 3 months from any location.',
     'Infrastructure', 'annual',
     'International Telecommunication Union (ITU) World Telecommunication/ICT Indicators Database.'),

    -- Climate
    ('EN.ATM.CO2E.PC',    'CO2 emissions (metric tons per capita)',
     'Carbon dioxide emissions are those stemming from the burning of fossil fuels and the manufacture of cement.',
     'Climate', 'annual',
     'Climate Watch. 2020. GHG Emissions. Washington, DC: World Resources Institute.'),

    -- Governance / GNI
    ('NY.GNP.PCAP.CD',    'GNI per capita, Atlas method (current US$)',
     'GNI per capita (formerly GNP per capita) is the gross national income, converted to U.S. dollars using the World Bank Atlas method.',
     'Governance', 'annual',
     'World Bank national accounts data, and OECD National Accounts data files.')

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    frequency = EXCLUDED.frequency,
    source_note = EXCLUDED.source_note,
    updated_at = now();


-- ============================================================
-- 5. NEW OPERATIONAL TABLES
-- ============================================================

-- -------------------------------------------------------
-- 5a. crawl_batches — tracks phased country crawling
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS crawl_batches (
    batch_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number  INT NOT NULL,
    countries     TEXT[] NOT NULL,
    indicators    TEXT[] NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at    TIMESTAMPTZ,
    finished_at   TIMESTAMPTZ,
    rows_synced   INT DEFAULT 0,
    error_message TEXT,
    created_at    TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE crawl_batches IS 'Tracks phased crawling batches for World Bank data ingestion.';
COMMENT ON COLUMN crawl_batches.batch_number IS 'Sequential batch number within a crawl run.';
COMMENT ON COLUMN crawl_batches.countries IS 'Array of ISO3 country codes in this batch.';
COMMENT ON COLUMN crawl_batches.indicators IS 'Array of indicator codes to fetch for this batch.';

-- -------------------------------------------------------
-- 5b. data_quality_checks — tracks data quality metrics
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_quality_checks (
    check_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_type  TEXT NOT NULL
                CHECK (check_type IN ('null_rate', 'duplicate', 'freshness', 'coverage')),
    entity_type TEXT
                CHECK (entity_type IN ('country', 'indicator', 'batch')),
    entity_id   TEXT,
    status      TEXT
                CHECK (status IN ('pass', 'warn', 'fail')),
    details     JSONB,
    checked_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE data_quality_checks IS 'Stores results of automated data quality checks.';
COMMENT ON COLUMN data_quality_checks.check_type IS 'Type of quality check: null_rate, duplicate, freshness, or coverage.';
COMMENT ON COLUMN data_quality_checks.details IS 'JSON details about the check result including thresholds and actual values.';


-- ============================================================
-- 6. MATERIALIZED VIEW: Indicator Coverage
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_indicator_coverage AS
SELECT
    country_code,
    indicator_code,
    COUNT(*)                                           AS year_count,
    MIN(year)                                          AS first_year,
    MAX(year)                                          AS latest_year,
    COUNT(*) FILTER (WHERE value IS NOT NULL)          AS non_null_count
FROM wb_indicator_values
GROUP BY country_code, indicator_code;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_indicator_coverage_pk
    ON mv_indicator_coverage (country_code, indicator_code);


-- ============================================================
-- 7. INDEXES on new tables
-- ============================================================

-- crawl_batches indexes
CREATE INDEX IF NOT EXISTS idx_crawl_batches_status
    ON crawl_batches (status);

CREATE INDEX IF NOT EXISTS idx_crawl_batches_batch_number
    ON crawl_batches (batch_number);

CREATE INDEX IF NOT EXISTS idx_crawl_batches_created_at
    ON crawl_batches (created_at DESC);

-- data_quality_checks indexes
CREATE INDEX IF NOT EXISTS idx_dqc_check_type
    ON data_quality_checks (check_type);

CREATE INDEX IF NOT EXISTS idx_dqc_entity
    ON data_quality_checks (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_dqc_status
    ON data_quality_checks (status);

CREATE INDEX IF NOT EXISTS idx_dqc_checked_at
    ON data_quality_checks (checked_at DESC);

-- Additional index on wb_countries for new columns
CREATE INDEX IF NOT EXISTS idx_wb_countries_iso2
    ON wb_countries (iso2_code);

CREATE INDEX IF NOT EXISTS idx_wb_countries_region
    ON wb_countries (region);

CREATE INDEX IF NOT EXISTS idx_wb_countries_income_level
    ON wb_countries (income_level);

-- Additional index on wb_indicators for category
CREATE INDEX IF NOT EXISTS idx_wb_indicators_category
    ON wb_indicators (category);


-- ============================================================
-- 8. RPC FUNCTIONS
-- ============================================================

-- -------------------------------------------------------
-- 8a. get_all_countries() — all countries with indicator counts
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION get_all_countries()
RETURNS TABLE (
    code          TEXT,
    name          TEXT,
    region        TEXT,
    income_level  TEXT,
    iso2_code     TEXT,
    capital_city  TEXT,
    lending_type  TEXT,
    longitude     NUMERIC,
    latitude      NUMERIC,
    indicator_count BIGINT,
    latest_year   INT
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        c.code,
        c.name,
        c.region,
        c.income_level,
        c.iso2_code,
        c.capital_city,
        c.lending_type,
        c.longitude,
        c.latitude,
        COUNT(DISTINCT v.indicator_code) AS indicator_count,
        MAX(v.year)                      AS latest_year
    FROM wb_countries c
    LEFT JOIN wb_indicator_values v ON v.country_code = c.code
    GROUP BY c.code, c.name, c.region, c.income_level,
             c.iso2_code, c.capital_city, c.lending_type,
             c.longitude, c.latitude
    ORDER BY c.name;
$$;

COMMENT ON FUNCTION get_all_countries() IS 'Returns all countries with their latest indicator counts and most recent data year.';

-- -------------------------------------------------------
-- 8b. get_country_report(p_country) — comprehensive country report
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION get_country_report(p_country TEXT)
RETURNS TABLE (
    country_code    TEXT,
    country_name    TEXT,
    region          TEXT,
    income_level    TEXT,
    indicator_code  TEXT,
    indicator_name  TEXT,
    category        TEXT,
    year            INT,
    value           NUMERIC,
    yoy_change_pct  NUMERIC
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        c.code          AS country_code,
        c.name          AS country_name,
        c.region,
        c.income_level,
        i.code          AS indicator_code,
        i.name          AS indicator_name,
        i.category,
        v.year,
        v.value,
        CASE
            WHEN LAG(v.value) OVER (
                PARTITION BY v.indicator_code ORDER BY v.year
            ) IS NOT NULL
            AND LAG(v.value) OVER (
                PARTITION BY v.indicator_code ORDER BY v.year
            ) != 0
            THEN ROUND(
                ((v.value - LAG(v.value) OVER (
                    PARTITION BY v.indicator_code ORDER BY v.year
                )) / ABS(LAG(v.value) OVER (
                    PARTITION BY v.indicator_code ORDER BY v.year
                ))) * 100, 2
            )
        END AS yoy_change_pct
    FROM wb_indicator_values v
    JOIN wb_countries c  ON c.code = v.country_code
    JOIN wb_indicators i ON i.code = v.indicator_code
    WHERE v.country_code = p_country
      AND v.value IS NOT NULL
    ORDER BY i.category, i.code, v.year;
$$;

COMMENT ON FUNCTION get_country_report(TEXT) IS 'Returns a comprehensive report for one country showing all indicators with year-over-year changes.';

-- -------------------------------------------------------
-- 8c. get_crawl_progress() — crawl batch status summary
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION get_crawl_progress()
RETURNS TABLE (
    status           TEXT,
    batch_count      BIGINT,
    total_rows_synced BIGINT,
    earliest_start   TIMESTAMPTZ,
    latest_finish    TIMESTAMPTZ,
    failed_batches   BIGINT
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        cb.status,
        COUNT(*)              AS batch_count,
        COALESCE(SUM(cb.rows_synced), 0) AS total_rows_synced,
        MIN(cb.started_at)    AS earliest_start,
        MAX(cb.finished_at)   AS latest_finish,
        COUNT(*) FILTER (WHERE cb.status = 'failed') AS failed_batches
    FROM crawl_batches cb
    GROUP BY cb.status
    ORDER BY
        CASE cb.status
            WHEN 'running'   THEN 1
            WHEN 'pending'   THEN 2
            WHEN 'completed' THEN 3
            WHEN 'failed'    THEN 4
        END;
$$;

COMMENT ON FUNCTION get_crawl_progress() IS 'Returns a summary of crawl batch progress grouped by status.';

-- -------------------------------------------------------
-- 8d. get_indicator_coverage_summary() — coverage stats per indicator
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION get_indicator_coverage_summary()
RETURNS TABLE (
    indicator_code    TEXT,
    indicator_name    TEXT,
    category          TEXT,
    country_count     BIGINT,
    avg_year_span     NUMERIC,
    avg_non_null_pct  NUMERIC,
    min_first_year    INT,
    max_latest_year   INT
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        i.code            AS indicator_code,
        i.name            AS indicator_name,
        i.category,
        COUNT(DISTINCT mc.country_code)  AS country_count,
        ROUND(AVG(mc.year_count), 1)     AS avg_year_span,
        ROUND(AVG(
            CASE WHEN mc.year_count > 0
                 THEN (mc.non_null_count::NUMERIC / mc.year_count) * 100
                 ELSE 0
            END
        ), 1)                            AS avg_non_null_pct,
        MIN(mc.first_year)               AS min_first_year,
        MAX(mc.latest_year)              AS max_latest_year
    FROM wb_indicators i
    LEFT JOIN mv_indicator_coverage mc ON mc.indicator_code = i.code
    GROUP BY i.code, i.name, i.category
    ORDER BY i.category, i.code;
$$;

COMMENT ON FUNCTION get_indicator_coverage_summary() IS 'Returns coverage statistics per indicator using the mv_indicator_coverage materialized view.';

-- Update refresh function to include new materialized view
CREATE OR REPLACE FUNCTION refresh_wb_materialized_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_country_year_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_indicator_trends;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_indicator_coverage;
END;
$$;


-- ============================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE crawl_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_checks ENABLE ROW LEVEL SECURITY;

-- crawl_batches policies
DROP POLICY IF EXISTS "Public read crawl_batches" ON crawl_batches;
CREATE POLICY "Public read crawl_batches"
    ON crawl_batches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service write crawl_batches" ON crawl_batches;
CREATE POLICY "Service write crawl_batches"
    ON crawl_batches FOR ALL USING (true) WITH CHECK (true);

-- data_quality_checks policies
DROP POLICY IF EXISTS "Public read data_quality_checks" ON data_quality_checks;
CREATE POLICY "Public read data_quality_checks"
    ON data_quality_checks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service write data_quality_checks" ON data_quality_checks;
CREATE POLICY "Service write data_quality_checks"
    ON data_quality_checks FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- Done. Summary:
--   - wb_countries: expanded with iso2_code, lending_type; seeded ~217 countries
--   - wb_indicators: expanded with category, frequency, source_note; seeded 20 indicators
--   - crawl_batches: new table for phased crawl tracking
--   - data_quality_checks: new table for quality monitoring
--   - mv_indicator_coverage: new materialized view for coverage analysis
--   - 4 RPC functions: get_all_countries, get_country_report,
--     get_crawl_progress, get_indicator_coverage_summary
--   - RLS policies on all new tables
--   - Indexes on all new tables and new columns
-- ============================================================
