import React, { useEffect, useState } from 'react';
import { useIdeas } from '../stores';
import { Plus, Search, Trash2, Edit2, Lightbulb } from 'lucide-react';

const STATUSES = ['CAPTURED', 'EXPLORING', 'VALIDATED', 'BUILDING', 'COMPLETED', 'ABANDONED'];

export function Ideas() {
  const { items, fetch, add, update, remove, loading } = useIdeas();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<any>(null);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const techStackRaw = formData.get('techStack') as string;
    const techStack = techStackRaw ? techStackRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    const data = {
      title: formData.get('title') as string,
      problem: formData.get('problem') as string,
      solution: formData.get('solution') as string,
      status: formData.get('status') as string,
      priority: formData.get('priority') as string,
      techStack,
    };
    
    if (editingIdea) update(editingIdea.id, data);
    else add(data);
    
    setIsModalOpen(false);
    setEditingIdea(null);
  };

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          (item.problem && item.problem.toLowerCase().includes(search.toLowerCase())) ||
                          (item.solution && item.solution.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-mono text-[var(--accent)] flex items-center gap-2"><Lightbulb size={24}/> Idea Vault</h1>
        <button onClick={() => { setEditingIdea(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-[var(--accent)] text-black px-4 py-2 rounded font-bold hover:brightness-110">
          <Plus size={16} /> New Idea
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
          <input 
            type="text" 
            placeholder="Search ideas..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded pl-10 pr-4 py-2 focus:border-[var(--accent)] outline-none text-[var(--text-primary)]"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[var(--surface)] border border-[var(--border)] rounded px-4 py-2 text-[var(--text-primary)] outline-none"
        >
          <option value="ALL">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? <div className="text-[var(--text-muted)]">Loading ideas...</div> : 
          filteredItems.length === 0 ? <div className="text-[var(--text-muted)] py-8">No ideas found.</div> :
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((idea: any) => (
              <div key={idea.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg flex flex-col group overflow-hidden">
                <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[var(--text-primary)]">{idea.title}</h3>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--surface)] rounded">
                      <button onClick={() => { setEditingIdea(idea); setIsModalOpen(true); }} className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)]"><Edit2 size={14}/></button>
                      <button onClick={() => { if(window.confirm('Delete idea?')) remove(idea.id); }} className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)]"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider">
                    <span className="text-[var(--text-dim)] px-2 py-0.5 rounded bg-[var(--surface-3)]">{idea.status}</span>
                    <span className={`px-2 py-0.5 rounded ${idea.priority === 'CRITICAL' || idea.priority === 'HIGH' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>{idea.priority}</span>
                  </div>
                </div>
                
                <div className="p-4 flex-1 space-y-4 text-sm">
                  <div>
                    <h4 className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1">Problem</h4>
                    <p className="text-[var(--text-primary)] italic">{idea.problem || 'No problem defined.'}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1">Solution</h4>
                    <p className="text-[var(--text-primary)]">{idea.solution || 'No solution defined.'}</p>
                  </div>
                </div>
                
                {idea.techStack && idea.techStack.length > 0 && (
                  <div className="p-3 bg-[var(--surface-2)] border-t border-[var(--border)] flex flex-wrap gap-1">
                    {idea.techStack.map((tech: string, i: number) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">{tech}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        }
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-10">
          <form onSubmit={handleSubmit} className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)] w-full max-w-lg shadow-xl m-auto">
            <h2 className="text-xl font-bold mb-4">{editingIdea ? 'Edit Idea' : 'New Idea'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Title</label>
                <input required name="title" defaultValue={editingIdea?.title} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Status</label>
                  <select name="status" defaultValue={editingIdea?.status || 'CAPTURED'} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Priority</label>
                  <select name="priority" defaultValue={editingIdea?.priority || 'MEDIUM'} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none">
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">The Problem</label>
                <textarea name="problem" defaultValue={editingIdea?.problem} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" rows={2} />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">The Solution</label>
                <textarea name="solution" defaultValue={editingIdea?.solution} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" rows={3} />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Tech Stack (comma separated)</label>
                <input name="techStack" defaultValue={editingIdea?.techStack?.join(', ')} placeholder="NextJS, Neon, Stripe..." className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[var(--border)]">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded text-[var(--text-muted)] hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-[var(--accent)] text-black font-bold hover:brightness-110">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
