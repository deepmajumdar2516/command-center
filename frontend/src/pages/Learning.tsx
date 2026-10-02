import React, { useEffect, useState } from 'react';
import { useLearning } from '../stores';
import { Plus, Trash2, Edit2, BookOpen, ChevronRight, ChevronDown } from 'lucide-react';

const STATUSES = ['NOT_STARTED', 'LEARNING', 'REVIEW', 'COMPLETED'];
const TYPES = ['COURSE', 'SUBJECT', 'TOPIC'];
const DIFFICULTIES = ['HIGH', 'MEDIUM', 'LOW'];

export function Learning() {
  const { items, fetch, add, update, remove, loading } = useLearning();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      type: formData.get('type') as string,
      status: formData.get('status') as string,
      difficulty: formData.get('difficulty') as string,
      progress: parseInt(formData.get('progress') as string) || 0,
      studyTime: parseInt(formData.get('studyTime') as string) || 0,
      parentId: formData.get('parentId') as string || null,
      notes: formData.get('notes') as string,
    };
    
    if (editingItem) update(editingItem.id, data);
    else add(data);
    
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Build Hierarchy
  const buildHierarchy = (parentId: string | null = null): any[] => {
    return items
      .filter((i: any) => i.parentId === parentId)
      .map((i: any) => ({ ...i, children: buildHierarchy(i.id) }));
  };

  const hierarchy = buildHierarchy(null);

  const renderItem = (item: any, depth = 0) => (
    <div key={item.id} className="w-full">
      <div 
        className={`flex justify-between items-center bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 hover:border-[var(--accent)]/50 group transition-colors mb-2`}
        style={{ marginLeft: `${depth * 24}px` }}
      >
        <div className="flex items-center gap-3">
          {item.children.length > 0 ? (
            <button onClick={() => toggleExpand(item.id)} className="text-[var(--text-muted)] hover:text-white">
              {expanded[item.id] ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
            </button>
          ) : (
            <div className="w-4" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                item.type === 'COURSE' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' :
                item.type === 'SUBJECT' ? 'bg-[var(--info)]/20 text-[var(--info)]' : 'bg-[var(--surface-3)] text-[var(--text-muted)]'
              }`}>{item.type}</span>
              <h3 className="font-bold text-[var(--text-primary)]">{item.title}</h3>
            </div>
            {item.notes && <p className="text-xs text-[var(--text-muted)] mt-1">{item.notes}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <div className="text-xs text-[var(--text-muted)] mb-1">
              <span className="font-bold text-white mr-2">{item.progress}%</span>
              <span className="text-[var(--text-dim)]">{item.status}</span>
            </div>
            <div className="h-1 w-24 bg-[var(--surface-3)] rounded-full overflow-hidden ml-auto">
              <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${item.progress}%` }} />
            </div>
          </div>
          
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-1.5 bg-[var(--surface-2)] rounded hover:text-[var(--accent)]"><Edit2 size={14}/></button>
            <button onClick={() => { if(window.confirm('Delete item? (Will delete children too)')) remove(item.id); }} className="p-1.5 bg-[var(--surface-2)] rounded hover:text-[var(--danger)]"><Trash2 size={14}/></button>
          </div>
        </div>
      </div>
      
      {expanded[item.id] && item.children.length > 0 && (
        <div className="w-full">
          {item.children.map((child: any) => renderItem(child, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-mono text-[var(--accent)] flex items-center gap-2"><BookOpen size={24}/> Learning</h1>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-[var(--accent)] text-black px-4 py-2 rounded font-bold hover:brightness-110">
          <Plus size={16} /> New Subject
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? <div className="text-[var(--text-muted)]">Loading learning resources...</div> : 
         hierarchy.length === 0 ? <div className="text-[var(--text-muted)] py-8 text-center">No learning items found.</div> :
         <div className="w-full">
           {hierarchy.map(item => renderItem(item, 0))}
         </div>
        }
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-10">
          <form onSubmit={handleSubmit} className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)] w-full max-w-lg shadow-xl m-auto">
            <h2 className="text-xl font-bold mb-4">{editingItem ? 'Edit Learning Item' : 'New Learning Item'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Title</label>
                <input required name="title" defaultValue={editingItem?.title} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Type</label>
                  <select name="type" defaultValue={editingItem?.type || 'SUBJECT'} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none">
                    {TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Status</label>
                  <select name="status" defaultValue={editingItem?.status || 'NOT_STARTED'} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Parent Item (Optional)</label>
                  <select name="parentId" defaultValue={editingItem?.parentId || ''} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none">
                    <option value="">None (Top Level)</option>
                    {items.filter((i:any) => i.id !== editingItem?.id).map((i:any) => (
                      <option key={i.id} value={i.id}>{i.title} ({i.type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Difficulty</label>
                  <select name="difficulty" defaultValue={editingItem?.difficulty || 'MEDIUM'} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none">
                    {DIFFICULTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Progress (%)</label>
                <div className="flex gap-4 items-center">
                  <input type="range" name="progress" min="0" max="100" defaultValue={editingItem?.progress || 0} className="flex-1 accent-[var(--accent)]" 
                    onChange={(e) => {
                      const output = e.currentTarget.nextElementSibling as HTMLOutputElement;
                      if (output) output.value = e.currentTarget.value + '%';
                    }}
                  />
                  <output className="w-12 text-right font-mono text-[var(--accent)]">{editingItem?.progress || 0}%</output>
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Notes</label>
                <textarea name="notes" defaultValue={editingItem?.notes} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" rows={2} />
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
