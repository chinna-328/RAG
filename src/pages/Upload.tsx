import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Brain, Check, FileText, Layers, Lock, Upload as UploadIcon } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { createNotebook, uploadDocument } from '@/lib/api';
import { useSettingsStore } from '@/store/notebook.store';
import { cn } from '@/lib/cn';

type Stage = 'idle' | 'uploading' | 'chunking' | 'embedding' | 'done' | 'error';

const STAGES: { id: Stage; label: string; Icon: typeof UploadIcon }[] = [
  { id: 'uploading', label: 'Uploading file', Icon: UploadIcon },
  { id: 'chunking', label: 'Chunking text', Icon: Layers },
  { id: 'embedding', label: 'Generating embeddings', Icon: Brain },
  { id: 'done', label: 'Ready', Icon: Check },
];

export function UploadPage() {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settings } = useSettingsStore();

  const [notebookId, setNotebookId] = useState<string | null>(paramId ?? null);
  const [stage, setStage] = useState<Stage>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<{ pages: number; chunks: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tickerRef = useRef<number | null>(null);

  useEffect(() => () => { if (tickerRef.current) window.clearInterval(tickerRef.current); }, []);

  const startTicker = (target: Stage, durationMs: number) => {
    if (tickerRef.current) window.clearInterval(tickerRef.current);
    setStage(target);
    setProgress(0);
    const stepMs = 80;
    const steps = Math.max(1, Math.floor(durationMs / stepMs));
    let i = 0;
    tickerRef.current = window.setInterval(() => {
      i += 1;
      const v = Math.min(95, Math.round((i / steps) * 100));
      setProgress(v);
      if (v >= 95 && tickerRef.current) {
        window.clearInterval(tickerRef.current);
        tickerRef.current = null;
      }
    }, stepMs) as unknown as number;
  };

  const handleFile = async (chosen: File) => {
    setFile(chosen);
    setError(null);
    setResult(null);

    let nbId = notebookId;
    if (!nbId) {
      try {
        const nb = await createNotebook(stripExt(chosen.name));
        nbId = nb.id;
        setNotebookId(nb.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create notebook');
        setStage('error');
        return;
      }
    }

    // Approximate the three real stages with timed progress so the UI feels honest.
    startTicker('uploading', 1200);
    try {
      // Kick off the upload immediately. The backend does upload+chunk+embed in one shot.
      const promise = uploadDocument(nbId, chosen, {
        chunkSize: settings.chunkSize,
        chunkOverlap: settings.chunkOverlap,
      });

      // Sequence the visual stages while we wait.
      await sleep(1200);
      startTicker('chunking', 1200);
      await sleep(1200);
      startTicker('embedding', 4000);

      const { source } = await promise;
      if (tickerRef.current) {
        window.clearInterval(tickerRef.current);
        tickerRef.current = null;
      }
      setProgress(100);
      setStage('done');
      setResult({ pages: source.pages, chunks: source.chunks });
    } catch (err) {
      if (tickerRef.current) {
        window.clearInterval(tickerRef.current);
        tickerRef.current = null;
      }
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStage('error');
    }
  };

  const reset = () => {
    setFile(null);
    setStage('idle');
    setProgress(0);
    setError(null);
    setResult(null);
  };

  if (stage === 'idle') {
    return (
      <div className="h-full flex flex-col">
        <header className="px-10 py-6 border-b border-line-1 flex-shrink-0">
          <h1 className="m-0 font-serif text-[32px] font-normal tracking-tight">
            Add a document
          </h1>
          <p className="m-0 mt-1 text-fg-2 text-sm">
            PDFs and plain text are supported. Files stay on your server.
          </p>
        </header>
        <div className="flex-1 overflow-auto p-10 grid place-items-center">
          <div className="w-full max-w-[640px]">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) void handleFile(f);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl py-20 px-10 text-center transition-all cursor-pointer',
                dragOver
                  ? 'border-accent bg-[rgba(0,212,255,0.06)] shadow-[0_0_24px_rgba(0,212,255,0.3)]'
                  : 'border-line-2 bg-bg-1/60 hover:border-line-3 hover:shadow-[0_0_18px_rgba(0,212,255,0.18)]'
              )}
            >
              <div className="w-[72px] h-[72px] rounded-2xl bg-bg-2 border border-line-2 grid place-items-center mx-auto mb-6 text-accent">
                <UploadIcon size={28} />
              </div>
              <div className="text-xl font-medium mb-2">Drop your document here</div>
              <div className="text-fg-2 text-sm">
                or click to browse · PDF, TXT, MD, CSV up to 50MB
              </div>
              <div className="mt-7">
                <Button icon={<UploadIcon size={14} />}>Choose file</Button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".pdf,.txt,.md,.csv,application/pdf,text/plain,text/markdown,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
            <div className="mt-6 p-4 bg-bg-1 border border-line-1 rounded-md text-[13px] text-fg-2 flex gap-3">
              <Lock size={16} className="text-accent flex-shrink-0 mt-0.5" />
              <div>
                Your documents stay private. Embeddings are stored in your Qdrant
                instance and never used to train models.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full grid place-items-center p-10">
      <Card className="w-full max-w-[540px] p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-md bg-bg-2 border border-line-2 grid place-items-center text-danger">
            <FileText size={20} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium truncate">{file?.name ?? 'Document'}</div>
            <div className="text-xs text-fg-2">
              {file ? formatBytes(file.size) : ''}
              {result ? ` · ${result.pages} pages · ${result.chunks} chunks` : ''}
            </div>
          </div>
          {stage === 'done' && (
            <Badge variant="success" icon={<Check size={12} />}>
              Indexed
            </Badge>
          )}
          {stage === 'error' && <Badge variant="danger">Error</Badge>}
        </div>

        {stage === 'error' ? (
          <div>
            <p className="text-danger text-sm mb-4">{error}</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={reset}>Try again</Button>
              {notebookId && (
                <Button onClick={() => navigate(`/app/notebooks/${notebookId}`)}>
                  Open notebook
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {STAGES.map((s) => {
              const stageIdx = STAGES.findIndex((x) => x.id === stage);
              const myIdx = STAGES.findIndex((x) => x.id === s.id);
              const status =
                myIdx < stageIdx ? 'done' : myIdx === stageIdx ? 'active' : 'pending';
              const Icon = s.Icon;
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-md grid place-items-center flex-shrink-0 border',
                      status === 'pending' && 'bg-bg-2 border-line-2 text-fg-3',
                      status === 'active' && 'bg-[rgba(0,212,255,0.18)] border-accent text-accent shadow-[0_0_12px_rgba(0,212,255,0.4)]',
                      status === 'done' && 'bg-[rgba(0,255,157,0.14)] border-[rgba(0,255,157,0.5)] text-neon shadow-[0_0_10px_rgba(0,255,157,0.3)]'
                    )}
                  >
                    {status === 'done' ? (
                      <Check size={14} />
                    ) : status === 'active' ? (
                      <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    ) : (
                      <Icon size={14} />
                    )}
                  </div>
                  <div
                    className={cn(
                      'flex-1 text-sm',
                      status === 'pending' ? 'text-fg-3' : 'text-fg-0'
                    )}
                  >
                    {s.label}
                  </div>
                  {status === 'active' && (
                    <div className="w-20 h-1 bg-bg-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-[width] duration-100"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {stage === 'done' && (
          <div className="mt-6 pt-6 border-t border-line-1 flex gap-2">
            <Button
              fullWidth
              iconRight={<ArrowRight size={14} />}
              onClick={() => notebookId && navigate(`/app/notebooks/${notebookId}`)}
            >
              Open notebook
            </Button>
            <Button variant="secondary" onClick={reset}>
              Upload another
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripExt(filename: string): string {
  return filename.replace(/\.[^.]+$/, '');
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}
