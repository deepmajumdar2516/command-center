import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNotes } from '../stores';
import { Plus, Search, Trash2, Pin, Copy, Check, Clock } from 'lucide-react';
import { RichTextEditor } from '../components/RichTextEditor';

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function Notes() {
  const { items, fetch, add, update, remove, loading } = useNotes();
  const [search, setSearch] = useState('');
  const [activeNote, setActiveNote] = useState<any>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);

  const activeNoteRef = useRef<any>(null);
  activeNoteRef.current = activeNote;

  const debounceTimerRef = useRef<any>(null);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Handle first load selection
  useEffect(() => {
    if (items.length > 0 && !activeNote) {
      const sorted = [...items].sort((a: any, b: any) => Number(b.pinned) - Number(a.pinned));
      setActiveNote(sorted[0]);
    }
  }, [items]);

  // Flush any pending save before changing notes or unmounting
  const flushPendingSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      if (activeNoteRef.current?.id && activeNoteRef.current?.content !== undefined) {
        update(activeNoteRef.current.id, { content: activeNoteRef.current.content });
        setIsAutosaving(false);
      }
    }
  }, [update]);

  useEffect(() => {
    return () => {
      flushPendingSave();
    };
  }, [flushPendingSave]);

  const selectNote = (note: any) => {
    if (activeNote?.id === note.id) return;
    flushPendingSave();
    setActiveNote(note);
  };

  const createNote = () => {
    flushPendingSave();
    add({
      title: 'Untitled Note',
      content: '<p></p>',
      category: 'PERSONAL',
      pinned: false,
    });
  };

  const duplicateNote = (note: any) => {
    flushPendingSave();
    add({
      title: `${note.title} (Copy)`,
      content: note.content || '',
      category: note.category || 'PERSONAL',
      tags: note.tags || [],
      pinned: false,
    });
  };

  const togglePin = (note: any) => {
    const newPinned = !note.pinned;
    update(note.id, { pinned: newPinned });
    if (activeNote?.id === note.id) {
      setActiveNote({ ...activeNote, pinned: newPinned });
    }
  };

  const handleContentChange = (newHtml: string) => {
    if (!activeNote) return;
    
    // Update local state without re-rendering editor
    setActiveNote((prev: any) => (prev ? { ...prev, content: newHtml } : prev));
    setIsAutosaving(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (activeNoteRef.current?.id) {
        update(activeNoteRef.current.id, { content: newHtml });
        setIsAutosaving(false);
      }
    }, 700);
  };

  const handleTitleChange = (title: string) => {
    if (!activeNote) return;
    setActiveNote({ ...activeNote, title });
    update(activeNote.id, { title });
  };

  const handleDelete = (noteId: string) => {
    if (window.confirm('Delete note? This note can be recovered from the Recovery section.')) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      remove(noteId);
      setActiveNote(null);
    }
  };

  const filteredNotes = items
    .filter((n: any) => {
      const q = search.toLowerCase();
      const titleMatch = (n.title || '').toLowerCase().includes(q);
      const contentText = stripHtml(n.content || '').toLowerCase();
      return titleMatch || contentText.includes(q);
    })
    .sort((a: any, b: any) => Number(b.pinned) - Number(a.pinned)); // Pinned first

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-mono text-[var(--accent)]">Notes</h1>
          <p className="text-xs text-[var(--text-muted)]">
            Rich-text formatted personal notes and developer documents.
          </p>
        </div>
        <button
          onClick={createNote}
          className="flex items-center gap-2 bg-[var(--accent)] text-black px-4 py-2 rounded-lg font-bold hover:brightness-110 shadow-sm transition-all text-xs"
        >
          <Plus size={16} /> New Note
        </button>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        {/* Left pane: List */}
        <div className="w-80 flex flex-col gap-3 border-r border-[var(--border)] pr-4 min-h-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input
              type="text"
              placeholder="Search notes by title or text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg pl-9 pr-4 py-2 focus:border-[var(--accent)] outline-none text-[var(--text-primary)] text-xs"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
            {loading ? (
              <div className="text-[var(--text-muted)] text-xs text-center py-6">Loading notes...</div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-[var(--text-muted)] text-xs text-center py-8">
                {search ? 'No matching notes found.' : 'No notes yet. Click "+ New Note" to create one.'}
              </div>
            ) : (
              filteredNotes.map((note: any) => {
                const isSelected = activeNote?.id === note.id;
                const snippet = stripHtml(note.content || '');

                return (
                  <div
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1.5 transition-all group ${
                      isSelected
                        ? 'bg-[var(--surface-3)] border-[var(--accent)] shadow-sm'
                        : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-sm truncate text-[var(--text-primary)]">
                        {note.title || 'Untitled Note'}
                      </h3>
                      {note.pinned && (
                        <Pin size={13} className="text-[var(--accent)] flex-shrink-0 fill-[var(--accent)]/30 mt-0.5" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                      {snippet || 'Empty note...'}
                    </p>
                    <div className="text-[10px] text-[var(--text-dim)] font-mono mt-0.5 flex items-center justify-between">
                      <span>
                        {new Date(note.updatedAt || note.createdAt || Date.now()).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {note.category && (
                        <span className="uppercase text-[9px] px-1.5 py-0.2 bg-[var(--surface-2)] rounded border border-[var(--border)]">
                          {note.category}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right pane: Rich Text Editor */}
        {activeNote ? (
          <div className="flex-1 flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden min-h-0 shadow-lg">
            {/* Note Header */}
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-2)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <input
                value={activeNote.title || ''}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="flex-1 bg-transparent text-xl font-bold outline-none text-[var(--text-primary)] focus:border-b border-[var(--accent)] transition-colors"
                placeholder="Note Title"
              />

              <div className="flex items-center gap-2">
                {/* Autosave status indicator */}
                <div className="text-[11px] font-mono text-[var(--text-dim)] flex items-center gap-1.5 px-2 py-1 bg-[var(--surface)] rounded border border-[var(--border)]">
                  {isAutosaving ? (
                    <>
                      <Clock size={12} className="text-amber-400 animate-spin" />
                      <span className="text-amber-400">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={12} className="text-[var(--accent)]" />
                      <span className="text-[var(--text-muted)]">Saved</span>
                    </>
                  )}
                </div>

                <div className="flex gap-1 text-[var(--text-muted)] border-l border-[var(--border)] pl-2">
                  <button
                    onClick={() => togglePin(activeNote)}
                    className={`p-2 rounded-lg hover:bg-[var(--surface-3)] transition-colors ${
                      activeNote.pinned ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'hover:text-[var(--text-primary)]'
                    }`}
                    title={activeNote.pinned ? 'Unpin Note' : 'Pin Note'}
                  >
                    <Pin size={16} className={activeNote.pinned ? 'fill-[var(--accent)]/30' : ''} />
                  </button>
                  <button
                    onClick={() => duplicateNote(activeNote)}
                    className="p-2 rounded-lg hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] transition-colors"
                    title="Duplicate Note"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(activeNote.id)}
                    className="p-2 rounded-lg hover:bg-[var(--danger)]/15 hover:text-[var(--danger)] transition-colors"
                    title="Move to Recovery"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Rich Text Editor */}
            <RichTextEditor
              key={activeNote.id}
              noteId={activeNote.id}
              initialContent={activeNote.content || ''}
              onChange={handleContentChange}
              onBlur={flushPendingSave}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] border border-[var(--border)] rounded-xl border-dashed p-8 text-center">
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">No note selected</p>
            <p className="text-xs mb-4">Choose a note from the list on the left, or create a brand new note.</p>
            <button
              onClick={createNote}
              className="px-4 py-2 bg-[var(--accent)] text-black rounded-lg text-xs font-bold hover:brightness-110 flex items-center gap-1.5"
            >
              <Plus size={14} /> Create Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}