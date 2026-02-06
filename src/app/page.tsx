import Chatbot from '@/components/chatbot';
import Contact from '@/components/contact';
import Gallery from '@/components/gallery';
import Hero from '@/components/hero';
import Header from '@/components/layout/header';
import Testimonials from '@/components/testimonials';

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <Header />
      <main className="flex-1">
        <Hero />
        <Gallery />
        <Testimonials />
        <Contact />
      </main>
      <Chatbot />
    </div>
  );
}
