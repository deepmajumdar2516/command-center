import React, { useEffect, useState } from 'react';
import { useApplications } from '../stores';
import { Plus, Search, Trash2, Edit2, LayoutList, Columns } from 'lucide-react';

const STATUSES = ['WISHLIST', 'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'];

export function Applications() {
  const { items, fetch, add, update, remove, loading } = useApplications();
  const [view, setView] = useState<'KANBAN' | 'TABLE'>('KANBAN');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<any>(null);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      company: formData.get('company') as string,
      role: formData.get('role') as string,
      status: formData.get('status') as string,
      jobType: formData.get('jobType') as string,
      location: formData.get('location') as string,
      salary: formData.get('salary') as string,
      applicationDate: formData.get('applicationDate') ? new Date(formData.get('applicationDate') as string).toISOString() : undefined,
    };
    
    if (editingApp) update(editingApp.id, data);
    else add(data);
    
    setIsModalOpen(false);
    setEditingApp(null);
  };

  const filteredItems = items.filter((item: any) => 
    item.company.toLowerCase().includes(search.toLowerCase()) || 
    item.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-mono text-[var(--accent)]">Applications</h1>
        <div className="flex gap-4">
          <div className="bg-[var(--surface-3)] p-1 rounded flex gap-1">
            <button onClick={() => setView('KANBAN')} className={`p-1.5 rounded ${view === 'KANBAN' ? 'bg-[var(--surface-4)] text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}><Columns size={16} /></button>
            <button onClick={() => setView('TABLE')} className={`p-1.5 rounded ${view === 'TABLE' ? 'bg-[var(--surface-4)] text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}><LayoutList size={16} /></button>
          </div>
          <button onClick={() => { setEditingApp(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-[var(--accent)] text-black px-4 py-2 rounded font-bold hover:brightness-110">
            <Plus size={16} /> New Application
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
          <input 
            type="text" 
            placeholder="Search company or role..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded pl-10 pr-4 py-2 focus:border-[var(--accent)] outline-none text-[var(--text-primary)]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {loading ? <div className="text-[var(--text-muted)]">Loading applications...</div> : 
          view === 'KANBAN' ? (
            <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-4 pb-4">
              {STATUSES.map(status => (
                <div key={status} className="w-80 flex-shrink-0 flex flex-col bg-[var(--surface)] rounded border border-[var(--border)] overflow-hidden">
                  <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-2)] flex justify-between items-center">
                    <h3 className="font-bold text-sm text-[var(--text-primary)]">{status}</h3>
                    <span className="text-xs bg-[var(--surface-3)] px-2 py-0.5 rounded text-[var(--text-muted)]">
                      {filteredItems.filter((i:any) => i.status === status).length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {filteredItems.filter((i:any) => i.status === status).map((app: any) => (
                      <div key={app.id} className="bg-[var(--surface-2)] border border-[var(--border)] rounded p-3 hover:border-[var(--accent)]/50 group cursor-pointer" onClick={() => { setEditingApp(app); setIsModalOpen(true); }}>
                        <div className="font-bold text-[var(--text-primary)]">{app.company}</div>
                        <div className="text-sm text-[var(--text-muted)]">{app.role}</div>
                        {(app.location || app.salary) && (
                          <div className="flex gap-2 mt-2 text-xs">
                            {app.location && <span className="text-[var(--text-dim)]">{app.location}</span>}
                            {app.salary && <span className="text-[var(--text-dim)]">{app.salary}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-auto bg-[var(--surface)] border border-[var(--border)] rounded">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--surface-2)] border-b border-[var(--border)] sticky top-0">
                  <tr>
                    <th className="p-3">Company</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Location</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((app: any) => (
                    <tr key={app.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--surface-2)]">
                      <td className="p-3 font-bold">{app.company}</td>
                      <td className="p-3">{app.role}</td>
                      <td className="p-3"><span className="px-2 py-1 rounded bg-[var(--surface-3)] text-xs">{app.status}</span></td>
                      <td className="p-3 text-[var(--text-muted)]">{app.jobType || '-'}</td>
                      <td className="p-3 text-[var(--text-muted)]">{app.location || '-'}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => { setEditingApp(app); setIsModalOpen(true); }} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)]"><Edit2 size={16} /></button>
                        <button onClick={() => { if(window.confirm('Delete application?')) remove(app.id); }} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)]"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)] w-full max-w-lg shadow-xl">
            <h2 className="text-xl font-bold mb-4">{editingApp ? 'Edit Application' : 'New Application'}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Company</label>
                  <input required name="company" defaultValue={editingApp?.company} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Role</label>
                  <input required name="role" defaultValue={editingApp?.role} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Status</label>
                  <select name="status" defaultValue={editingApp?.status || 'WISHLIST'} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Job Type</label>
                  <select name="jobType" defaultValue={editingApp?.jobType || 'FULL_TIME'} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none">
                    <option value="FULL_TIME">Full-time</option>
                    <option value="PART_TIME">Part-time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Location</label>
                  <input name="location" defaultValue={editingApp?.location} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Salary</label>
                  <input name="salary" defaultValue={editingApp?.salary} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Application Date</label>
                  <input type="date" name="applicationDate" defaultValue={editingApp?.applicationDate?.split('T')[0]} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[var(--border)]">
              {editingApp && <button type="button" onClick={() => { if(window.confirm('Delete application?')) { remove(editingApp.id); setIsModalOpen(false); } }} className="mr-auto px-4 py-2 rounded text-[var(--danger)] hover:bg-[var(--danger)]/10">Delete</button>}
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded text-[var(--text-muted)] hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-[var(--accent)] text-black font-bold hover:brightness-110">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
