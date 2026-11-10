import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import About from '../components/About';
import Projects from '../components/Projects';
import Journey from '../components/Journey';
import Skills from '../components/Skills';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import Terminal from '../components/Terminal';
import Loader from '../components/Loader';
import { useSmoothScroll } from '../lib/motion';
import { isTerminalKey } from '../components/Terminal';

export default function Home() {
  const [terminal, setTerminal] = useState(false);
  useSmoothScroll();

  // ~ or ` opens the terminal (but not while typing in a field)
  useEffect(() => {
    const onKey = (e) => {
      const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName);
      // e.code is the physical key left of "1", whatever the keyboard layout
      // (on a Ukrainian layout e.key there is "'", on a German one "^")
      if (isTerminalKey(e) && !typing && !e.defaultPrevented) {
        e.preventDefault();
        setTerminal((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <Loader />
      <Header onTerminal={() => setTerminal((v) => !v)} />
      <main id="main">
        <Hero />
        <About />
        <Projects />
        <Journey />
        <Skills />
        <Contact />
      </main>
      <Footer />
      <Terminal open={terminal} onClose={() => setTerminal(false)} />
    </>
  );
}
