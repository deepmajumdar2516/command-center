import { useEffect, useState } from 'react';
import * as stores from '../stores';
import { Plus, Trash2, Edit2, X } from 'lucide-react';

export function GenericModule({ title, storeName, fields }: { title: string, storeName: keyof typeof stores, fields: any[] }) {
  const useStore = (stores as any)[storeName];
  const { items, fetch, add, remove, update, loading } = useStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (editingId) {
      update(editingId, formData);
    } else {
      add(formData);
    }
    setIsModalOpen(false);
    setFormData({});
    setEditingId(null);
  };

  const handleEdit = (item: any) => {
    setFormData(item);
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-mono text-[var(--accent)]">{title.toUpperCase()}</h1>
        <button 
          onClick={() => { setFormData({}); setEditingId(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-[var(--accent)] text-black px-4 py-2 rounded font-medium hover:opacity-90"
        >
          <Plus size={16} /> New Record
        </button>
      </div>

      <div className="flex-1 overflow-y-auto glass-panel rounded-lg p-1">
        {loading ? (
          <div className="p-8 text-center text-[var(--text-muted)]">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)]">No records found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-strong)]">
                {fields.map(f => (
                  <th key={f.name} className="p-3 text-[var(--text-muted)] font-mono text-xs uppercase tracking-wider">{f.name}</th>
                ))}
                <th className="p-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)]">
                  {fields.map(f => (
                    <td key={f.name} className="p-3 text-[var(--text-primary)]">
                      {String(item[f.name] || '')}
                    </td>
                  ))}
                  <td className="p-3 flex gap-2 justify-end">
                    <button onClick={() => handleEdit(item)} className="text-[var(--info)] hover:text-white"><Edit2 size={16}/></button>
                    <button onClick={() => remove(item.id)} className="text-[var(--danger)] hover:text-white"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[var(--surface)] border border-[var(--border-strong)] rounded-lg shadow-2xl w-[500px] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-bold font-mono">{editingId ? 'EDIT' : 'NEW'} RECORD</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)] hover:text-white"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {fields.map(f => (
                <div key={f.name} className="flex flex-col gap-1">
                  <label className="text-xs font-mono text-[var(--text-muted)] uppercase">{f.name}</label>
                  {f.type === 'textarea' ? (
                    <textarea 
                      className="bg-[var(--surface-2)] border border-[var(--border)] rounded p-2 text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                      value={formData[f.name] || ''}
                      onChange={e => setFormData({...formData, [f.name]: e.target.value})}
                      rows={4}
                    />
                  ) : f.type === 'date' ? (
                    <input 
                      type="date"
                      className="bg-[var(--surface-2)] border border-[var(--border)] rounded p-2 text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                      value={formData[f.name] ? formData[f.name].split('T')[0] : ''}
                      onChange={e => setFormData({...formData, [f.name]: new Date(e.target.value).toISOString()})}
                    />
                  ) : (
                    <input 
                      type="text"
                      className="bg-[var(--surface-2)] border border-[var(--border)] rounded p-2 text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                      value={formData[f.name] || ''}
                      onChange={e => setFormData({...formData, [f.name]: e.target.value})}
                    />
                  )}
                </div>
              ))}
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded text-[var(--text-muted)] hover:text-white">Cancel</button>
                <button type="submit" className="bg-[var(--accent)] text-black px-4 py-2 rounded font-bold hover:opacity-90">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
