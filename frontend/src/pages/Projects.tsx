import React, { useEffect, useState } from 'react';
import { useProjects } from '../stores';
import { Plus, Search, Trash2, Edit2, Play, Pause, CheckCircle2 } from 'lucide-react';

const STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'];

export function Projects() {
  const { items, fetch, add, update, remove, loading } = useProjects();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Parse techStack correctly (split by comma)
    const techStackRaw = formData.get('techStack') as string;
    const techStack = techStackRaw ? techStackRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      status: formData.get('status') as string,
      priority: formData.get('priority') as string,
      progress: parseInt(formData.get('progress') as string) || 0,
      techStack,
      startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string).toISOString() : undefined,
      targetDate: formData.get('targetDate') ? new Date(formData.get('targetDate') as string).toISOString() : undefined,
    };
    
    if (editingProject) update(editingProject.id, data);
    else add(data);
    
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const filteredItems = items.filter((item: any) => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-mono text-[var(--accent)]">Projects</h1>
        <button onClick={() => { setEditingProject(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-[var(--accent)] text-black px-4 py-2 rounded font-bold hover:brightness-110">
          <Plus size={16} /> New Project
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
        <input 
          type="text" 
          placeholder="Search projects..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded pl-10 pr-4 py-2 focus:border-[var(--accent)] outline-none text-[var(--text-primary)]"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? <div className="text-[var(--text-muted)]">Loading projects...</div> : 
          filteredItems.length === 0 ? <div className="text-[var(--text-muted)] py-8">No projects found.</div> :
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((project: any) => (
              <div key={project.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 flex flex-col group">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-[var(--text-primary)]">{project.name}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingProject(project); setIsModalOpen(true); }} className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)]"><Edit2 size={16}/></button>
                    <button onClick={() => { if(window.confirm('Delete project?')) remove(project.id); }} className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)]"><Trash2 size={16}/></button>
                  </div>
                </div>
                
                <p className="text-sm text-[var(--text-muted)] mb-4 flex-1">{project.description}</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="px-2 py-0.5 rounded bg-[var(--surface-3)]">{project.status}</span>
                    <span className="text-[var(--text-dim)]">{project.priority}</span>
                  </div>
                  
                  {project.techStack && project.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.techStack.map((tech: string, i: number) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">{tech}</span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-muted)]">Progress</span>
                      <span className="font-mono text-[var(--accent)]">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--surface-3)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        }
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-10">
          <form onSubmit={handleSubmit} className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)] w-full max-w-lg shadow-xl m-auto">
            <h2 className="text-xl font-bold mb-4">{editingProject ? 'Edit Project' : 'New Project'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Name</label>
                <input required name="name" defaultValue={editingProject?.name} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Description</label>
                <textarea name="description" defaultValue={editingProject?.description} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Status</label>
                  <select name="status" defaultValue={editingProject?.status || 'PLANNING'} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Priority</label>
                  <select name="priority" defaultValue={editingProject?.priority || 'MEDIUM'} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none">
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Start Date</label>
                  <input type="date" name="startDate" defaultValue={editingProject?.startDate?.split('T')[0]} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Target Date</label>
                  <input type="date" name="targetDate" defaultValue={editingProject?.targetDate?.split('T')[0]} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Progress (%)</label>
                <div className="flex gap-4 items-center">
                  <input type="range" name="progress" min="0" max="100" defaultValue={editingProject?.progress || 0} className="flex-1 accent-[var(--accent)]" 
                    onChange={(e) => {
                      const output = e.currentTarget.nextElementSibling as HTMLOutputElement;
                      if (output) output.value = e.currentTarget.value + '%';
                    }}
                  />
                  <output className="w-12 text-right font-mono text-[var(--accent)]">{editingProject?.progress || 0}%</output>
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Tech Stack (comma separated)</label>
                <input name="techStack" defaultValue={editingProject?.techStack?.join(', ')} placeholder="React, Node, PostgreSQL..." className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
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
