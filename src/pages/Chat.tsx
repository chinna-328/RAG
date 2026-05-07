import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare, RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { SourcesPanel } from '@/components/chat/SourcesPanel';
import { DocViewer } from '@/components/chat/DocViewer';
import { AssistantMessage } from '@/components/chat/AssistantMessage';
import { Composer } from '@/components/chat/Composer';
import { getNotebook, streamChat } from '@/lib/api';
import { useSettingsStore } from '@/store/notebook.store';
import type { ChatMessage, Citation, Notebook } from '@shared/types';

const SUGGESTED = [
  'Summarize the key findings in this document.',
  'What are the main themes?',
  'List the most important conclusions with citations.',
];

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settings } = useSettingsStore();

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const [highlightedCite, setHighlightedCite] = useState<number | null>(null);
  const [pulseCite, setPulseCite] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load notebook
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getNotebook(id)
      .then((nb) => {
        if (cancelled) return;
        setNotebook(nb);
        if (nb.sources[0]) setActiveSourceId(nb.sources[0].id);
      })
      .catch((err) => !cancelled && setError(err.message ?? 'Failed to load'));
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Auto-scroll to bottom on new messages / token streams
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const lastAssistantCitations = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === 'assistant' && m.citations) return m.citations;
    }
    return [];
  })();

  const send = useCallback(() => {
    if (!id || !notebook || streaming) return;
    const query = input.trim();
    if (!query) return;
    if (notebook.sources.length === 0) {
      setError('Upload a document before asking questions.');
      return;
    }
    setInput('');
    setError(null);
    setMessages((m) => [
      ...m,
      { role: 'user', text: query },
      { role: 'assistant', text: '', pending: true },
    ]);
    setStreaming(true);

    abortRef.current = streamChat(id, query, settings.topK, {
      onCitations: (citations) => {
        setMessages((m) => {
          const next = [...m];
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].role === 'assistant') {
              next[i] = { ...next[i], citations } as ChatMessage;
              break;
            }
          }
          return next;
        });
      },
      onToken: (token) => {
        setMessages((m) => {
          const next = [...m];
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].role === 'assistant') {
              const prev = next[i] as ChatMessage & { role: 'assistant' };
              next[i] = { ...prev, text: prev.text + token };
              break;
            }
          }
          return next;
        });
      },
      onDone: () => {
        setMessages((m) => {
          const next = [...m];
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].role === 'assistant') {
              next[i] = { ...next[i], pending: false } as ChatMessage;
              break;
            }
          }
          return next;
        });
        setStreaming(false);
      },
      onError: (message) => {
        setError(message);
        setStreaming(false);
        setMessages((m) => m.filter((msg) => !(msg.role === 'assistant' && msg.pending)));
      },
    });
  }, [id, notebook, streaming, input, settings.topK]);

  const stop = () => {
    abortRef.current?.abort();
    setStreaming(false);
    setMessages((m) => m.filter((msg) => !(msg.role === 'assistant' && msg.pending)));
  };

  const handleCiteClick = useCallback(
    (c: Citation) => {
      if (notebook) {
        const src = notebook.sources.find((s) => s.id === c.sourceId);
        if (src) setActiveSourceId(src.id);
      }
      setPulseCite(c.n);
      setHighlightedCite(c.n);
    },
    [notebook]
  );

  if (!id) return <Navigate />;
  if (error && !notebook) {
    return (
      <div className="h-full grid place-items-center px-6">
        <div className="text-center">
          <h2 className="font-serif text-3xl mb-2">Notebook unavailable</h2>
          <p className="text-fg-2 mb-6">{error}</p>
          <Link to="/app">
            <Button variant="secondary" icon={<ArrowLeft size={14} />}>Back to library</Button>
          </Link>
        </div>
      </div>
    );
  }
  if (!notebook) {
    return (
      <div className="h-full grid place-items-center text-fg-2 text-sm">Loading…</div>
    );
  }

  const activeSource =
    notebook.sources.find((s) => s.id === activeSourceId) ?? notebook.sources[0] ?? null;

  return (
    <div className="h-full grid grid-cols-[300px_1fr_380px]">
      <SourcesPanel
        notebook={notebook}
        activeSourceId={activeSourceId}
        setActiveSourceId={setActiveSourceId}
        citations={lastAssistantCitations}
        highlightedCite={highlightedCite}
        setHighlightedCite={setHighlightedCite}
        onCiteClick={handleCiteClick}
        onAddSource={() => navigate(`/app/upload/${id}`)}
      />

      <div className="border-r border-line-1 overflow-hidden">
        <DocViewer
          notebookId={id ?? ''}
          source={activeSource}
          citations={lastAssistantCitations}
          highlightedCite={highlightedCite}
          pulseCite={pulseCite}
          onPulseConsumed={() => setPulseCite(null)}
        />
      </div>

      <section className="bg-bg-0 flex flex-col h-full overflow-hidden">
        <header className="px-5 py-3 border-b border-line-1 flex items-center gap-2 flex-shrink-0">
          <Link to="/app" className="w-8 h-8 grid place-items-center rounded-md text-fg-2 hover:text-fg-0 hover:bg-bg-2">
            <ArrowLeft size={14} />
          </Link>
          <MessageSquare size={14} className="text-accent" />
          <div className="flex-1 text-sm font-medium truncate">{notebook.title}</div>
          <button
            type="button"
            onClick={() => setMessages([])}
            className="w-8 h-8 grid place-items-center rounded-md text-fg-2 hover:text-fg-0 hover:bg-bg-2"
            title="Reset conversation"
          >
            <RefreshCcw size={14} />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-auto p-5 flex flex-col gap-5">
          {messages.length === 0 && (
            <EmptyState
              hasSources={notebook.sources.length > 0}
              onPrompt={(p) => setInput(p)}
              onUpload={() => navigate(`/app/upload/${id}`)}
            />
          )}
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="self-end max-w-[90%]">
                <div className="bg-accent text-[#001218] px-3.5 py-2.5 rounded-lg rounded-br-[4px] text-sm leading-snug font-medium">
                  {m.text}
                </div>
              </div>
            ) : (
              <AssistantMessage
                key={i}
                text={m.text}
                pending={m.pending}
                citations={m.citations}
                highlightedCite={highlightedCite}
                setHighlightedCite={setHighlightedCite}
                onCiteClick={handleCiteClick}
              />
            )
          )}
        </div>

        <div className="px-4 py-4 border-t border-line-1 flex-shrink-0">
          {error && (
            <div className="mb-2 text-xs text-danger">{error}</div>
          )}
          {messages.length === 0 && notebook.sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="px-2.5 py-1 rounded-full bg-bg-1 border border-line-2 text-fg-1 text-xs hover:bg-bg-2 hover:border-line-3"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <Composer
            value={input}
            onChange={setInput}
            onSend={send}
            onStop={stop}
            streaming={streaming}
            placeholder={
              notebook.sources.length === 0
                ? 'Upload a document first…'
                : 'Ask about this document…'
            }
          />
        </div>
      </section>
    </div>
  );
}

function Navigate() {
  // tiny helper for the impossible-id fallback
  return <div className="h-full grid place-items-center text-fg-2 text-sm">Notebook id missing.</div>;
}

function EmptyState({
  hasSources,
  onPrompt,
  onUpload,
}: {
  hasSources: boolean;
  onPrompt: (s: string) => void;
  onUpload: () => void;
}) {
  if (!hasSources) {
    return (
      <div className="m-auto text-center max-w-xs">
        <h3 className="font-serif text-2xl mb-2">Add a source</h3>
        <p className="text-sm text-fg-2 mb-5">
          Upload a PDF or text file to start chatting with it.
        </p>
        <Button onClick={onUpload}>Upload document</Button>
      </div>
    );
  }
  return (
    <div className="m-auto max-w-md text-center">
      <h3 className="font-serif text-3xl italic font-normal mb-2">
        Ask anything.
      </h3>
      <p className="text-sm text-fg-2">
        Lumen will read your document and answer with citations to the exact
        passages it used.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        {SUGGESTED.map((s) => (
          <button
            key={s}
            onClick={() => onPrompt(s)}
            className="px-3 py-2.5 rounded-md bg-bg-1 border border-line-2 text-fg-1 text-sm hover:bg-bg-2 hover:border-line-3 text-left"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
