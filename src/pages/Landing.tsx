import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Brain,
  Database,
  FileText,
  Layers,
  Lock,
  MessageSquare,
  Quote,
  Search,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { Card } from '@/components/ui/Card';

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[rgba(3,6,15,0.7)] border-b border-line-2 shadow-[0_1px_0_rgba(0,212,255,0.15)]">
      <div className="max-w-[1180px] mx-auto px-6 h-16 flex items-center justify-between">
        <Logo size={28} />
        <nav className="hidden md:flex items-center gap-7 text-sm text-fg-1">
          <a href="#features" className="hover:text-fg-0">Features</a>
          <a href="#how" className="hover:text-fg-0">How it works</a>
          <a href="#cta" className="hover:text-fg-0">Get started</a>
        </nav>
        <div className="flex gap-2">
          <Link to="/app">
            <Button size="sm">Open Lumen</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px]"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, rgba(0,212,255,0.22) 0%, transparent 70%), radial-gradient(40% 35% at 70% 30%, rgba(0,255,157,0.14) 0%, transparent 70%)',
        }}
      />
      <div className="relative max-w-[1180px] mx-auto px-6 pt-24 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-1 border border-line-2 text-xs text-fg-1 mb-8">
          <Sparkles size={12} className="text-accent" />
          A NotebookLM-style RAG, built for reading
        </div>
        <h1
          className="font-serif font-normal tracking-tight m-0 leading-[1.05]"
          style={{ fontSize: 'clamp(48px, 7vw, 96px)' }}
        >
          Talk to your <em className="text-accent-hi italic">documents.</em>
          <br />
          Get answers grounded in <em className="italic">the source.</em>
        </h1>
        <p className="mt-6 max-w-[640px] mx-auto text-fg-1 text-lg leading-relaxed">
          Lumen reads any PDF or note, indexes it, and answers your questions with citations
          to the exact passages it used. No hallucinations. No off-topic detours.
        </p>
        <div className="mt-10 flex gap-3 justify-center">
          <Link to="/app">
            <Button size="lg" iconRight={<ArrowRight size={16} />}>
              Open Lumen
            </Button>
          </Link>
          <a href="#how">
            <Button size="lg" variant="secondary">
              How it works
            </Button>
          </a>
        </div>

        <div className="mt-20 mx-auto max-w-[1024px]">
          <PreviewCard />
        </div>
      </div>
    </section>
  );
}

function PreviewCard() {
  return (
    <Card iso className="overflow-hidden p-0">
      <div className="grid grid-cols-[300px_1fr_360px] h-[480px] bg-bg-0 border-b border-line-1">
        <div className="border-r border-line-1 p-4">
          <div className="text-[10px] uppercase tracking-wider text-fg-2 mb-3">Sources</div>
          <div className="flex items-center gap-2 p-2 bg-bg-2 border border-line-2 rounded-md">
            <FileText size={13} className="text-danger" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">ipcc-ar6.pdf</div>
              <div className="text-[10px] text-fg-2">152 pages · 1,247 chunks</div>
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-fg-2 mt-5 mb-2">Retrieved</div>
          {[
            { p: 14, s: 0.92, t: 'Atmospheric CO₂ concentrations are higher than at any time in at least 2 million years…' },
            { p: 22, s: 0.88, t: 'The annual rate of increase from 2011–2020 averaged 2.4 ppm/year…' },
            { p: 9, s: 0.81, t: 'It is unequivocal that human influence has warmed the atmosphere…' },
          ].map((c, i) => (
            <div key={i} className="p-2 mb-1.5 bg-bg-1 border border-line-1 rounded text-[11px]">
              <div className="flex justify-between mb-1 font-mono text-fg-2">
                <span>p.{c.p}</span>
                <span className="text-accent">{c.s.toFixed(2)}</span>
              </div>
              <div className="text-fg-1 leading-snug line-clamp-2">{c.t}</div>
            </div>
          ))}
        </div>
        <div className="bg-bg-1 p-8 font-serif text-[13px] leading-[1.7] text-fg-1 border-r border-line-1">
          <div className="text-[10px] uppercase tracking-wider text-fg-3 mb-2 font-sans">Page 14</div>
          <p>
            Each of the last four decades has been successively warmer than any decade that
            preceded it since 1850.{' '}
            <mark className="bg-[rgba(0,255,157,0.45)] text-neon-hi px-1 rounded shadow-[0_0_12px_rgba(0,255,157,0.4)]">
              Atmospheric CO₂ concentrations are higher than at any time in at least 2 million
              years
            </mark>
            , and concentrations of methane and nitrous oxide are higher than at any time in at
            least 800,000 years.
          </p>
        </div>
        <div className="bg-bg-0 p-4 flex flex-col gap-3">
          <div className="self-end max-w-[80%] bg-accent text-[#001218] px-3 py-2 rounded-lg rounded-br-[4px] text-xs font-medium shadow-[0_0_18px_rgba(0,212,255,0.4)]">
            Summarize the key findings about CO₂ levels.
          </div>
          <div className="text-xs leading-relaxed text-fg-0">
            <span className="font-mono text-[10px] text-accent">Lumen</span>
            <p className="mt-1 m-0">
              Atmospheric CO₂ has reached levels unprecedented in 2 million years
              <sup className="font-mono text-[9px] bg-accent/20 text-accent-hi rounded px-1 ml-0.5">
                1
              </sup>
              , with annual increases averaging 2.4 ppm
              <sup className="font-mono text-[9px] bg-accent/20 text-accent-hi rounded px-1 ml-0.5">
                2
              </sup>
              . Human activities are unequivocally responsible
              <sup className="font-mono text-[9px] bg-accent/20 text-accent-hi rounded px-1 ml-0.5">
                3
              </sup>
              .
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Features() {
  const items = [
    {
      Icon: Quote,
      title: 'Cited answers',
      body: 'Every claim links to the exact passage. Hover to highlight the source. Click to jump.',
    },
    {
      Icon: Brain,
      title: 'Grounded by design',
      body: 'The model only sees retrieved chunks. If the answer isn\'t there, it says so.',
    },
    {
      Icon: Zap,
      title: 'Streaming responses',
      body: 'Tokens arrive as they\'re generated. No spinners. Just text.',
    },
    {
      Icon: Layers,
      title: 'Configurable chunking',
      body: 'Tune chunk size, overlap, and top-K from the Settings page.',
    },
    {
      Icon: Database,
      title: 'Real vector store',
      body: 'Qdrant under the hood. One collection per notebook for clean isolation.',
    },
    {
      Icon: Lock,
      title: 'Private by default',
      body: 'Your documents stay on your server. Embeddings stay in your Qdrant.',
    },
  ] as const;
  return (
    <section id="features" className="relative max-w-[1180px] mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <div className="text-xs uppercase tracking-[0.12em] text-fg-2 mb-3">Features</div>
        <h2 className="font-serif text-5xl font-normal tracking-tight m-0">
          Built for <em className="italic text-accent-hi">careful</em> reading.
        </h2>
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {items.map(({ Icon, title, body }) => (
          <Card key={title} className="p-6">
            <div className="w-10 h-10 rounded-md bg-bg-2 border border-line-2 grid place-items-center text-accent mb-4">
              <Icon size={18} />
            </div>
            <h3 className="text-base font-medium m-0 mb-1.5">{title}</h3>
            <p className="text-fg-2 text-sm leading-relaxed m-0">{body}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: '01', Icon: Upload, title: 'Upload', body: 'Drop a PDF or text file. Lumen extracts the text page by page.' },
    { n: '02', Icon: Layers, title: 'Chunk', body: 'A recursive splitter cuts the text into 1,000-char windows with 200-char overlap.' },
    { n: '03', Icon: Brain, title: 'Embed', body: 'Each chunk goes through Gemini\'s embedding model to a 768-d vector.' },
    { n: '04', Icon: Search, title: 'Retrieve', body: 'Your question is embedded and the top-K most similar chunks are pulled from Qdrant.' },
    { n: '05', Icon: MessageSquare, title: 'Answer', body: 'Gemini writes a grounded answer that cites every chunk it used.' },
  ];
  return (
    <section id="how" className="max-w-[1180px] mx-auto px-6 py-24 border-t border-line-1">
      <div className="text-center mb-16">
        <div className="text-xs uppercase tracking-[0.12em] text-fg-2 mb-3">Pipeline</div>
        <h2 className="font-serif text-5xl font-normal tracking-tight m-0">
          From upload to <em className="italic text-accent-hi">answer.</em>
        </h2>
      </div>
      <div className="grid gap-3 grid-cols-1 md:grid-cols-5">
        {steps.map(({ n, Icon, title, body }) => (
          <Card key={n} className="p-5">
            <div className="font-mono text-xs text-accent mb-3">{n}</div>
            <Icon size={20} className="mb-3 text-fg-1" />
            <div className="text-sm font-medium mb-1.5">{title}</div>
            <p className="text-xs text-fg-2 leading-relaxed m-0">{body}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="cta" className="relative max-w-[1180px] mx-auto px-6 py-32">
      <Card className="p-16 text-center relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(60% 60% at 50% 100%, rgba(0,212,255,0.2) 0%, transparent 70%), radial-gradient(45% 45% at 30% 90%, rgba(0,255,157,0.14) 0%, transparent 70%)',
          }}
        />
        <h2
          className="relative font-serif font-normal tracking-tight m-0"
          style={{ fontSize: 'clamp(36px, 4vw, 56px)' }}
        >
          Stop scrolling. <em className="italic text-accent-hi">Start asking.</em>
        </h2>
        <p className="relative mt-4 text-fg-1 max-w-[520px] mx-auto">
          Lumen is open-source. Bring your own Gemini and Qdrant keys and you\'re reading in
          minutes.
        </p>
        <div className="relative mt-8 flex gap-3 justify-center">
          <Link to="/app">
            <Button size="lg" iconRight={<ArrowRight size={16} />}>
              Open Lumen
            </Button>
          </Link>
        </div>
      </Card>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line-1">
      <div className="max-w-[1180px] mx-auto px-6 py-10 flex items-center justify-between text-xs text-fg-2">
        <Logo size={20} />
        <span>© Lumen — built for the NotebookLM RAG assignment.</span>
      </div>
    </footer>
  );
}
