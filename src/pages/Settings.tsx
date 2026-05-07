import { useEffect, useState } from 'react';
import { Brain, ChevronDown, Database, Layers, Settings as SettingsIcon, Keyboard } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { useSettingsStore } from '@/store/notebook.store';
import { getHealth } from '@/lib/api';
import { cn } from '@/lib/cn';

const SECTIONS = [
  { id: 'general', label: 'General', Icon: SettingsIcon },
  { id: 'models', label: 'Models', Icon: Brain },
  { id: 'rag', label: 'RAG pipeline', Icon: Layers },
  { id: 'storage', label: 'Storage', Icon: Database },
  { id: 'shortcuts', label: 'Shortcuts', Icon: Keyboard },
] as const;

export function SettingsPage() {
  const { settings, setSettings } = useSettingsStore();
  const [active, setActive] = useState<(typeof SECTIONS)[number]['id']>('rag');
  const [health, setHealth] = useState<{ gemini: boolean; qdrant: boolean } | null>(null);

  useEffect(() => {
    getHealth().then((h) => setHealth({ gemini: h.gemini, qdrant: h.qdrant })).catch(() => {});
  }, []);

  return (
    <div className="h-full grid grid-cols-[240px_1fr]">
      <aside className="border-r border-line-1 p-6">
        <h1 className="m-0 mb-6 font-serif text-2xl font-normal">Settings</h1>
        <div className="flex flex-col gap-0.5">
          {SECTIONS.map((s) => {
            const Icon = s.Icon;
            const isActive = active === s.id;
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => setActive(s.id)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-sm transition-colors',
                  isActive ? 'bg-bg-2 text-fg-0' : 'text-fg-1 hover:bg-bg-2 hover:text-fg-0'
                )}
              >
                <Icon size={15} className={isActive ? 'text-accent' : 'text-fg-2'} />
                {s.label}
              </button>
            );
          })}
        </div>
      </aside>

      <div className="overflow-auto px-12 py-10">
        <div className="max-w-[720px]">
          {active === 'rag' && (
            <>
              <h2 className="m-0 mb-1.5 text-[22px] font-medium">RAG pipeline</h2>
              <p className="m-0 text-fg-2 text-sm">
                Tune how documents are chunked, embedded, and retrieved. Changes take effect on
                the next upload or query.
              </p>
              <Card className="mt-8 p-7">
                <SettingRow
                  title="Chunking strategy"
                  desc="How documents are split before embedding."
                >
                  <Select
                    value="recursive"
                    options={[
                      { v: 'recursive', l: 'Recursive character (default)' },
                    ]}
                  />
                </SettingRow>
                <Divider />
                <SettingRow
                  title="Chunk size"
                  desc="Maximum characters per chunk. Larger = more context, fewer chunks."
                >
                  <SliderRow
                    value={settings.chunkSize}
                    onChange={(v) => setSettings({ chunkSize: v })}
                    min={200}
                    max={2000}
                    step={100}
                    unit="chars"
                  />
                </SettingRow>
                <Divider />
                <SettingRow
                  title="Chunk overlap"
                  desc="Characters shared between adjacent chunks to preserve context across boundaries."
                >
                  <SliderRow
                    value={settings.chunkOverlap}
                    onChange={(v) => setSettings({ chunkOverlap: v })}
                    min={0}
                    max={500}
                    step={50}
                    unit="chars"
                  />
                </SettingRow>
                <Divider />
                <SettingRow
                  title="Top-K retrieval"
                  desc="Number of chunks retrieved per query."
                >
                  <SliderRow
                    value={settings.topK}
                    onChange={(v) => setSettings({ topK: v })}
                    min={1}
                    max={10}
                    step={1}
                    unit="chunks"
                  />
                </SettingRow>
              </Card>
            </>
          )}

          {active === 'models' && (
            <>
              <h2 className="m-0 mb-1.5 text-[22px] font-medium">Models</h2>
              <p className="m-0 text-fg-2 text-sm">
                The current build is wired to Gemini for both embeddings and generation.
              </p>
              <Card className="mt-8 p-7">
                <SettingRow title="Embedding model" desc="Used to vectorize chunks and queries.">
                  <Select
                    value={settings.embeddingModel}
                    options={[{ v: 'gemini-embedding-001', l: 'gemini-embedding-001 (768d)' }]}
                  />
                </SettingRow>
                <Divider />
                <SettingRow title="Generation model" desc="Used to write grounded answers.">
                  <Select
                    value={settings.generationModel}
                    options={[{ v: 'gemini-2.5-flash', l: 'gemini-2.5-flash' }]}
                  />
                </SettingRow>
              </Card>
            </>
          )}

          {active === 'storage' && (
            <>
              <h2 className="m-0 mb-1.5 text-[22px] font-medium">Storage</h2>
              <p className="m-0 text-fg-2 text-sm">
                Qdrant Cloud. Each notebook gets its own collection.
              </p>
              <Card className="mt-8 p-7">
                <SettingRow title="Qdrant" desc="Vector store for indexed chunks.">
                  <span
                    className={cn(
                      'text-sm font-mono',
                      health?.qdrant ? 'text-success' : 'text-danger'
                    )}
                  >
                    {health == null ? '—' : health.qdrant ? 'Connected' : 'Not configured'}
                  </span>
                </SettingRow>
                <Divider />
                <SettingRow title="Gemini" desc="Embeddings + generation.">
                  <span
                    className={cn(
                      'text-sm font-mono',
                      health?.gemini ? 'text-success' : 'text-danger'
                    )}
                  >
                    {health == null ? '—' : health.gemini ? 'Configured' : 'Missing API key'}
                  </span>
                </SettingRow>
              </Card>
            </>
          )}

          {active === 'general' && (
            <>
              <h2 className="m-0 mb-1.5 text-[22px] font-medium">General</h2>
              <p className="m-0 text-fg-2 text-sm">
                Lumen ships dark-only. A light theme is on the roadmap.
              </p>
            </>
          )}

          {active === 'shortcuts' && (
            <>
              <h2 className="m-0 mb-1.5 text-[22px] font-medium">Shortcuts</h2>
              <p className="m-0 text-fg-2 text-sm">
                Keyboard shortcuts are coming soon.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingRow({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_280px] gap-6 py-4 items-center">
      <div>
        <div className="text-sm font-medium mb-1">{title}</div>
        <div className="text-[13px] text-fg-2">{desc}</div>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-line-1" />;
}

function Select({ value, options }: { value: string; options: { v: string; l: string }[] }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-bg-2 border border-line-2 rounded-md text-[13px]">
      <span>{options.find((o) => o.v === value)?.l ?? value}</span>
      <ChevronDown size={14} className="text-fg-2" />
    </div>
  );
}

function SliderRow({
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}) {
  return (
    <div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: 'var(--accent)' }}
      />
      <div className="flex justify-between mt-1.5 text-xs text-fg-2 font-mono">
        <span>{min}</span>
        <span className="text-accent">
          {value} {unit}
        </span>
        <span>{max}</span>
      </div>
    </div>
  );
}
