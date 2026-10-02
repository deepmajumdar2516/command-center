import React, { useEffect } from 'react';
import { useActivity } from '../stores';
import { Activity as ActivityIcon } from 'lucide-react';

export function Activity() {
  const { items, fetch, loading } = useActivity();

  useEffect(() => {
    fetch();
  }, [fetch]);

  const sortedActivities = [...items].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-mono text-[var(--accent)] flex items-center gap-2"><ActivityIcon /> Activity Log</h1>
      </div>

      <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded overflow-y-auto p-6">
        {loading ? <div className="text-[var(--text-muted)]">Loading activity...</div> : 
         sortedActivities.length === 0 ? <div className="text-[var(--text-muted)] py-8 text-center">No activity recorded yet.</div> :
         <div className="space-y-6 max-w-3xl">
           {sortedActivities.map((log: any) => (
             <div key={log.id} className="flex gap-4 relative before:absolute before:left-2.5 before:top-8 before:bottom-[-24px] before:w-px before:bg-[var(--border)] last:before:hidden group">
               <div className={`w-5 h-5 rounded-full mt-1 flex-shrink-0 z-10 flex items-center justify-center border-2 border-[var(--surface)] ${
                 log.type === 'CREATE' ? 'bg-[var(--accent)]' :
                 log.type === 'UPDATE' ? 'bg-[var(--info)]' :
                 log.type === 'DELETE' ? 'bg-[var(--danger)]' : 'bg-[var(--text-muted)]'
               }`} />
               <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded p-4 flex-1 group-hover:border-[var(--text-muted)] transition-colors">
                 <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-2">
                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wider ${
                       log.type === 'CREATE' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' :
                       log.type === 'UPDATE' ? 'bg-[var(--info)]/20 text-[var(--info)]' :
                       log.type === 'DELETE' ? 'bg-[var(--danger)]/20 text-[var(--danger)]' : 'bg-[var(--surface-3)] text-[var(--text-muted)]'
                     }`}>
                       {log.type}
                     </span>
                     <span className="text-xs text-[var(--text-dim)] font-mono">{log.entityType}</span>
                   </div>
                   <div className="text-xs font-mono text-[var(--text-muted)] bg-[var(--surface-3)] px-2 py-1 rounded">
                     {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                     {' • '}
                     {new Date(log.timestamp).toLocaleDateString()}
                   </div>
                 </div>
                 <div className="text-[var(--text-primary)] text-sm">{log.message}</div>
               </div>
             </div>
           ))}
         </div>
        }
      </div>
    </div>
  );
}
