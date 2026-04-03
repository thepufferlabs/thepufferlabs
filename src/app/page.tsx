import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Offerings from "@/components/sections/Offerings";
import WhyPufferLabs from "@/components/sections/WhyPufferLabs";

import Consulting from "@/components/sections/Consulting";
import CTA from "@/components/sections/CTA";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <About />
        <Offerings />
        <WhyPufferLabs />

        <Consulting />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
