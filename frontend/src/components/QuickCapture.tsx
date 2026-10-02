import React, { useEffect, useState } from 'react';
import { useTasks, useNotes, useProjects, useIdeas } from '../stores';

export function QuickCapture() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'TASK' | 'NOTE' | 'PROJECT' | 'IDEA'>('TASK');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { add: addTask } = useTasks();
  const { add: addNote } = useNotes();
  const { add: addProject } = useProjects();
  const { add: addIdea } = useIdeas();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    if (type === 'TASK') addTask({ title, description });
    if (type === 'NOTE') addNote({ title, content: description });
    if (type === 'PROJECT') addProject({ name: title, description });
    if (type === 'IDEA') addIdea({ title, problem: description });

    setIsOpen(false);
    setTitle('');
    setDescription('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[10vh]">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface-2)]">
          <h2 className="font-bold text-[var(--accent)] font-mono">Quick Capture</h2>
          <div className="flex gap-2">
            {['TASK', 'NOTE', 'PROJECT', 'IDEA'].map((t) => (
              <button 
                key={t}
                type="button"
                onClick={() => setType(t as any)}
                className={`px-3 py-1 text-xs rounded font-bold transition-colors ${type === t ? 'bg-[var(--accent)] text-black' : 'bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-white'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <input 
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`${type.charAt(0) + type.slice(1).toLowerCase()} title...`}
            className="bg-transparent text-xl font-bold outline-none text-[var(--text-primary)] placeholder-[var(--text-dim)]"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details (optional)..."
            rows={4}
            className="bg-transparent text-sm outline-none text-[var(--text-muted)] resize-none"
          />
          <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-[var(--text-dim)] flex gap-4">
              <span><kbd className="font-mono bg-[var(--surface-3)] px-1 py-0.5 rounded mr-1">Esc</kbd> to cancel</span>
              <span><kbd className="font-mono bg-[var(--surface-3)] px-1 py-0.5 rounded mr-1">Enter</kbd> to save</span>
            </span>
            <button type="submit" className="px-6 py-2 bg-[var(--accent)] text-black font-bold rounded hover:brightness-110">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
