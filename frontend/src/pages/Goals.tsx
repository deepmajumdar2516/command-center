import React, { useEffect, useState } from 'react';
import { useGoals } from '../stores';
import { Plus, Trash2, Edit2 } from 'lucide-react';

const STATUSES = ['ACTIVE', 'COMPLETED', 'PAUSED'];

export function Goals() {
  const { items, fetch, add, update, remove, loading } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      status: formData.get('status') as string,
      progress: parseInt(formData.get('progress') as string) || 0,
      category: formData.get('category') as string,
    };
    
    if (editingGoal) update(editingGoal.id, data);
    else add(data);
    
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  const activeGoals = items.filter((g: any) => g.status === 'ACTIVE' || g.status === 'PAUSED');
  const completedGoals = items.filter((g: any) => g.status === 'COMPLETED');

  const GoalCard = ({ goal }: { goal: any }) => (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 flex flex-col group">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-[var(--text-primary)]">{goal.name}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => { setEditingGoal(goal); setIsModalOpen(true); }} className="p-1 text-[var(--text-muted)] hover:text-[var(--accent)]"><Edit2 size={16}/></button>
          <button onClick={() => { if(window.confirm('Delete goal?')) remove(goal.id); }} className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)]"><Trash2 size={16}/></button>
        </div>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-4 flex-1">{goal.description}</p>
      <div className="space-y-3">
        <div className="flex justify-between text-xs">
          <span className={`px-2 py-0.5 rounded ${goal.status === 'ACTIVE' ? 'bg-[var(--purple)]/20 text-[var(--purple)]' : 'bg-[var(--surface-3)] text-[var(--text-muted)]'}`}>{goal.status}</span>
          {goal.category && <span className="text-[var(--text-dim)]">{goal.category}</span>}
        </div>
        <div className="pt-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--text-muted)]">Progress</span>
            <span className="font-mono text-[var(--purple)]">{goal.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-[var(--surface-3)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--purple)] transition-all" style={{ width: `${goal.progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-6 overflow-y-auto pr-2">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold font-mono text-[var(--accent)]">Goals</h1>
        <button onClick={() => { setEditingGoal(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-[var(--accent)] text-black px-4 py-2 rounded font-bold hover:brightness-110">
          <Plus size={16} /> New Goal
        </button>
      </div>

      {loading ? <div className="text-[var(--text-muted)]">Loading goals...</div> : (
        <>
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--purple)]"/> Active Goals
            </h2>
            {activeGoals.length === 0 ? <p className="text-[var(--text-muted)] text-sm mb-4">No active goals.</p> :
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {activeGoals.map((g: any) => <GoalCard key={g.id} goal={g} />)}
              </div>
            }
          </div>

          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--text-muted)]">
              <span className="w-2 h-2 rounded-full bg-[var(--text-dim)]"/> Completed Goals
            </h2>
            {completedGoals.length === 0 ? <p className="text-[var(--text-muted)] text-sm">No completed goals.</p> :
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70 hover:opacity-100 transition-opacity">
                {completedGoals.map((g: any) => <GoalCard key={g.id} goal={g} />)}
              </div>
            }
          </div>
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)] w-full max-w-lg shadow-xl m-auto">
            <h2 className="text-xl font-bold mb-4">{editingGoal ? 'Edit Goal' : 'New Goal'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Name</label>
                <input required name="name" defaultValue={editingGoal?.name} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Description</label>
                <textarea name="description" defaultValue={editingGoal?.description} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Status</label>
                  <select name="status" defaultValue={editingGoal?.status || 'ACTIVE'} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Category</label>
                  <input name="category" defaultValue={editingGoal?.category} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Progress (%)</label>
                <div className="flex gap-4 items-center">
                  <input type="range" name="progress" min="0" max="100" defaultValue={editingGoal?.progress || 0} className="flex-1 accent-[var(--purple)]" 
                    onChange={(e) => {
                      const output = e.currentTarget.nextElementSibling as HTMLOutputElement;
                      if (output) output.value = e.currentTarget.value + '%';
                    }}
                  />
                  <output className="w-12 text-right font-mono text-[var(--purple)]">{editingGoal?.progress || 0}%</output>
                </div>
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
