import React, { useEffect, useState } from 'react';
import { useNotes } from '../stores';
import { Plus, Search, Trash2, Pin, Copy } from 'lucide-react';

export function Notes() {
  const { items, fetch, add, update, remove, loading } = useNotes();
  const [search, setSearch] = useState('');
  const [activeNote, setActiveNote] = useState<any>(null);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Handle first load selection
  useEffect(() => {
    if (items.length > 0 && !activeNote) {
      setActiveNote(items.sort((a: any, b: any) => Number(b.pinned) - Number(a.pinned))[0]);
    }
  }, [items]);

  const createNote = () => {
    add({
      title: 'Untitled Note',
      content: '',
      category: 'PERSONAL',
      pinned: false
    });
  };

  const duplicateNote = (note: any) => {
    add({
      title: `${note.title} (Copy)`,
      content: note.content,
      category: note.category,
      tags: note.tags,
      pinned: false
    });
  };

  const togglePin = (note: any) => {
    update(note.id, { pinned: !note.pinned });
    if (activeNote?.id === note.id) {
      setActiveNote({ ...activeNote, pinned: !note.pinned });
    }
  };

  const saveNoteContent = (content: string) => {
    if (!activeNote) return;
    setActiveNote({ ...activeNote, content });
    update(activeNote.id, { content });
  };

  const saveNoteTitle = (title: string) => {
    if (!activeNote) return;
    setActiveNote({ ...activeNote, title });
    update(activeNote.id, { title });
  };

  const filteredNotes = items
    .filter((n: any) => n.title.toLowerCase().includes(search.toLowerCase()) || (n.content && n.content.toLowerCase().includes(search.toLowerCase())))
    .sort((a: any, b: any) => Number(b.pinned) - Number(a.pinned)); // Pinned first

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-mono text-[var(--accent)]">Notes</h1>
        <button onClick={createNote} className="flex items-center gap-2 bg-[var(--accent)] text-black px-4 py-2 rounded font-bold hover:brightness-110">
          <Plus size={16} /> New Note
        </button>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left pane: List */}
        <div className="w-80 flex flex-col gap-4 border-r border-[var(--border)] pr-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded pl-10 pr-4 py-2 focus:border-[var(--accent)] outline-none text-[var(--text-primary)]"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? <div className="text-[var(--text-muted)]">Loading notes...</div> : 
             filteredNotes.length === 0 ? <div className="text-[var(--text-muted)] text-center py-8">No notes found.</div> :
             filteredNotes.map((note: any) => (
               <div 
                 key={note.id}
                 onClick={() => setActiveNote(note)}
                 className={`p-3 rounded border cursor-pointer flex flex-col gap-1 group ${activeNote?.id === note.id ? 'bg-[var(--surface-3)] border-[var(--accent)]' : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--text-muted)]'}`}
               >
                 <div className="flex justify-between items-start">
                   <h3 className={`font-bold truncate ${activeNote?.id === note.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>{note.title || 'Untitled Note'}</h3>
                   {note.pinned && <Pin size={14} className="text-[var(--accent)] flex-shrink-0" />}
                 </div>
                 <p className="text-xs text-[var(--text-muted)] line-clamp-2">{note.content || 'Empty note...'}</p>
                 <div className="text-[10px] text-[var(--text-dim)] mt-1">{new Date(note.updatedAt).toLocaleDateString()}</div>
               </div>
             ))
            }
          </div>
        </div>

        {/* Right pane: Editor */}
        {activeNote ? (
          <div className="flex-1 flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-2)] flex justify-between items-start">
              <input 
                value={activeNote.title} 
                onChange={(e) => saveNoteTitle(e.target.value)}
                className="flex-1 bg-transparent text-xl font-bold outline-none text-[var(--text-primary)] focus:border-b border-[var(--accent)] mr-4" 
                placeholder="Note Title"
              />
              <div className="flex gap-1 text-[var(--text-muted)]">
                <button onClick={() => togglePin(activeNote)} className={`p-2 rounded hover:bg-[var(--surface-3)] ${activeNote.pinned ? 'text-[var(--accent)]' : 'hover:text-[var(--text-primary)]'}`} title="Pin"><Pin size={16}/></button>
                <button onClick={() => duplicateNote(activeNote)} className="p-2 rounded hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]" title="Duplicate"><Copy size={16}/></button>
                <button onClick={() => { if(window.confirm('Delete note?')) { remove(activeNote.id); setActiveNote(null); } }} className="p-2 rounded hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]" title="Delete"><Trash2 size={16}/></button>
              </div>
            </div>
            
            <textarea 
              value={activeNote.content || ''}
              onChange={(e) => saveNoteContent(e.target.value)}
              placeholder="Start typing your note (Markdown supported)..."
              className="flex-1 w-full bg-transparent p-6 outline-none text-[var(--text-primary)] resize-none whitespace-pre-wrap font-mono"
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] border border-[var(--border)] rounded border-dashed">
            Select or create a note
          </div>
        )}
      </div>
    </div>
  );
}
