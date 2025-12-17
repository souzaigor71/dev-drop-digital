import Header from "@/components/Header";
import Hero from "@/components/Hero";
import GallerySection from "@/components/GallerySection";
import DownloadsSection from "@/components/DownloadsSection";
import PublicationsSection from "@/components/PublicationsSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <GallerySection />
      <DownloadsSection />
      <PublicationsSection />
      <AboutSection />
      <Footer />
    </div>
  );
};

export default Index;
