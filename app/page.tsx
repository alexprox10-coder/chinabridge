import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Advantages from "@/components/Advantages";
import Process from "@/components/Process";
import Services from "@/components/Services";
import Directions from "@/components/Directions";
import Cases from "@/components/Cases";
import Calculator from "@/components/Calculator";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <Advantages />
      <Process />
      <Services />
      <Directions />
      <Cases />
      <Calculator />
      <FAQ />
      <Footer />
    </main>
  );
}
