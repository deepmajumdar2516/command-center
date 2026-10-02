import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Trash2, RotateCcw, ShieldAlert } from 'lucide-react';
import { useToast } from '../components/Toaster';

export function Recovery() {
  const [deletedItems, setDeletedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeleted = async () => {
    setLoading(true);
    try {
      const resources = ['tasks', 'projects', 'notes', 'ideas', 'applications', 'learning', 'goals', 'calendar', 'worksheets', 'whiteboards'];
      let allDeleted: any[] = [];
      
      for (const res of resources) {
        const items = await (api as any)[res].getDeleted();
        // Filter out items that don't have deletedAt set (just in case)
        const deleted = items.filter((i: any) => i.deletedAt).map((i: any) => ({
          ...i,
          _type: res,
          _displayTitle: i.title || i.name || i.company || `Item in ${res}`
        }));
        allDeleted = [...allDeleted, ...deleted];
      }
      
      // Sort by deletedAt desc
      allDeleted.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
      setDeletedItems(allDeleted);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDeleted();
  }, []);

  const handleRestore = async (id: string, type: string) => {
    try {
      await (api as any)[type].restore(id);
      useToast.getState().addToast(`Restored successfully`, 'success');
      fetchDeleted();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePermanentDelete = async (id: string, type: string) => {
    if (!confirm("Are you sure you want to permanently delete this? This cannot be undone.")) return;
    try {
      await (api as any)[type].hardDelete(id);
      useToast.getState().addToast(`Permanently deleted`, 'info');
      fetchDeleted();
    } catch (e) {
      console.error(e);
    }
  };

  const emptyState = (
    <div className="flex flex-col items-center justify-center h-64 text-[var(--text-muted)]">
      <ShieldAlert size={48} className="mb-4 opacity-50" />
      <p>No recently deleted items found.</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-mono text-[var(--text-primary)] uppercase tracking-wider">Recovery</h1>
        <p className="text-[var(--text-muted)]">Restore recently deleted items or permanently erase them.</p>
      </div>

      <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-8 text-center text-[var(--text-muted)]">Scanning records...</div>
        ) : deletedItems.length === 0 ? (
          emptyState
        ) : (
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[var(--surface-2)] sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-xs tracking-wider text-[var(--text-muted)] uppercase font-semibold">Item</th>
                  <th className="p-4 text-xs tracking-wider text-[var(--text-muted)] uppercase font-semibold">Module</th>
                  <th className="p-4 text-xs tracking-wider text-[var(--text-muted)] uppercase font-semibold">Deleted At</th>
                  <th className="p-4 text-right text-xs tracking-wider text-[var(--text-muted)] uppercase font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {deletedItems.map((item) => (
                  <tr key={`${item._type}-${item.id}`} className="hover:bg-[var(--surface-2)] transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-[var(--text-primary)]">{item._displayTitle}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-[var(--surface-3)] text-xs rounded-md uppercase tracking-wider">
                        {item._type}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--text-muted)]">
                      {new Date(item.deletedAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleRestore(item.id, item._type)}
                          className="px-3 py-1 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 rounded-md flex items-center gap-2"
                        >
                          <RotateCcw size={14} /> Restore
                        </button>
                        <button 
                          onClick={() => handlePermanentDelete(item.id, item._type)}
                          className="px-3 py-1 bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20 rounded-md flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
