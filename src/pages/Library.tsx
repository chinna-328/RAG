import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, MessageSquare, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createNotebook, deleteNotebook, listNotebooks, renameNotebook } from '@/lib/api';
import type { Notebook } from '@shared/types';

export function LibraryPage() {
  const [notebooks, setNotebooks] = useState<Notebook[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listNotebooks()
      .then(setNotebooks)
      .catch((err) => setError(err.message ?? 'Failed to load notebooks'));
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const handleNew = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const nb = await createNotebook('Untitled notebook');
      navigate(`/app/upload/${nb.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (nb: Notebook) => {
    const next = window.prompt('Rename notebook', nb.title)?.trim();
    if (!next || next === nb.title) return;
    try {
      const updated = await renameNotebook(nb.id, next);
      setNotebooks((prev) => prev?.map((n) => (n.id === nb.id ? updated : n)) ?? prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rename failed');
    }
  };

  const handleDelete = async (nb: Notebook) => {
    if (!window.confirm(`Delete "${nb.title}"? This cannot be undone.`)) return;
    try {
      await deleteNotebook(nb.id);
      setNotebooks((prev) => prev?.filter((n) => n.id !== nb.id) ?? prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const q = query.trim().toLowerCase();
  const filtered =
    notebooks && q
      ? notebooks.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.sources.some((s) => s.filename.toLowerCase().includes(q))
        )
      : notebooks;

  return (
    <div className="h-full flex flex-col">
      <header className="px-10 py-6 border-b border-line-1 flex items-center justify-between flex-shrink-0 gap-3">
        <div>
          <div className="text-xs text-fg-2 uppercase tracking-[0.08em] mb-1">Your library</div>
          <h1 className="m-0 font-serif text-[32px] font-normal tracking-tight">Notebooks</h1>
        </div>
        <div className="flex gap-2 items-center">
          {searchOpen ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-bg-2 border border-line-2 rounded-md w-[280px]">
              <Search size={14} className="text-fg-2" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setQuery('');
                    setSearchOpen(false);
                  }
                }}
                placeholder="Search notebooks…"
                className="bg-transparent outline-none text-sm flex-1 text-fg-0 placeholder:text-fg-2"
              />
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSearchOpen(false);
                }}
                className="text-fg-2 hover:text-fg-0"
                aria-label="Close search"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <Button
              variant="secondary"
              icon={<Search size={14} />}
              onClick={() => setSearchOpen(true)}
            >
              Search
            </Button>
          )}
          <Button onClick={handleNew} icon={<Plus size={14} />} disabled={creating}>
            New notebook
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-10 py-8">
        <div className="flex gap-2 mb-6 items-center">
          <div className="flex-1" />
          <span className="text-[13px] text-fg-2">Sort by: Recent</span>
        </div>

        {error && <div className="text-danger text-sm mb-4">{error}</div>}

        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
          <Card
            dashed
            hover
            onClick={handleNew}
            className="p-6 flex flex-col items-center justify-center min-h-[200px]"
          >
            <div className="w-12 h-12 rounded-xl bg-bg-2 grid place-items-center mb-3 text-accent">
              <Plus size={20} />
            </div>
            <div className="text-sm font-medium">New notebook</div>
            <div className="text-xs text-fg-2 mt-1">Drop a PDF or start blank</div>
          </Card>

          {filtered?.map((nb) => (
            <NotebookCard
              key={nb.id}
              notebook={nb}
              onOpen={() =>
                navigate(nb.sources.length === 0 ? `/app/upload/${nb.id}` : `/app/notebooks/${nb.id}`)
              }
              onRename={() => handleRename(nb)}
              onDelete={() => handleDelete(nb)}
            />
          ))}
        </div>

        {notebooks && notebooks.length === 0 && (
          <div className="text-fg-2 text-sm mt-8 text-center">
            No notebooks yet. Create one to get started.
          </div>
        )}
        {notebooks && notebooks.length > 0 && filtered && filtered.length === 0 && (
          <div className="text-fg-2 text-sm mt-8 text-center">
            No notebooks match “{query}”.
          </div>
        )}
      </div>
    </div>
  );
}

function NotebookCard({
  notebook,
  onOpen,
  onRename,
  onDelete,
}: {
  notebook: Notebook;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const color = notebook.color ?? '#00d4ff';
  const updated = relTime(notebook.updatedAt);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <Card hover onClick={onOpen} className="p-5 min-h-[200px] flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 rounded-md grid place-items-center"
          style={{
            background: `${color}22`,
            border: `1px solid ${color}55`,
            color,
          }}
        >
          <BookOpen size={16} />
        </div>
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            className="text-fg-2 p-1 rounded hover:text-fg-0 hover:bg-bg-2"
            aria-label="More"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div
              role="menu"
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 z-10 w-40 bg-bg-1 border border-line-2 rounded-md shadow-lg py-1 text-sm"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onRename();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-bg-2"
              >
                <Pencil size={13} className="text-fg-2" /> Rename
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-danger hover:bg-bg-2"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="text-[15px] font-medium mb-1.5">{notebook.title}</div>
      <div className="text-[13px] text-fg-2 flex-1 leading-relaxed">
        {notebook.sources[0]?.filename ?? 'No sources yet.'}
      </div>
      <div className="flex gap-3 mt-4 pt-3 border-t border-line-1 text-xs text-fg-2 items-center">
        <span className="inline-flex items-center gap-1">
          <FileText size={12} /> {notebook.sources.length}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare size={12} /> {notebook.asks}
        </span>
        <div className="flex-1" />
        <span>{updated}</span>
      </div>
    </Card>
  );
}

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w}w ago`;
  return new Date(iso).toLocaleDateString();
}
