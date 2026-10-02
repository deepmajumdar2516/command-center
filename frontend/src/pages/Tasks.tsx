import React, { useEffect, useState } from 'react';
import { useTasks } from '../stores';
import { Plus, Search, Trash2, CheckCircle2, Circle, Edit2 } from 'lucide-react';

export function Tasks() {
  const { items, fetch, add, update, remove, loading } = useTasks();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      status: formData.get('status') as string,
      priority: formData.get('priority') as string,
      dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string).toISOString() : undefined,
    };
    
    if (editingTask) {
      update(editingTask.id, data);
    } else {
      add(data);
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const toggleComplete = (task: any) => {
    const isComplete = task.status === 'COMPLETED';
    update(task.id, { 
      status: isComplete ? 'TODO' : 'COMPLETED',
      completedAt: isComplete ? null : new Date().toISOString()
    });
  };

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-mono text-[var(--accent)]">Tasks</h1>
        <button onClick={() => { setEditingTask(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-[var(--accent)] text-black px-4 py-2 rounded font-bold hover:brightness-110">
          <Plus size={16} /> New Task
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
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
          <option value="BACKLOG">Backlog</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="BLOCKED">Blocked</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {loading ? <div className="text-[var(--text-muted)]">Loading tasks...</div> : 
          filteredItems.length === 0 ? <div className="text-[var(--text-muted)] text-center py-8">No tasks found.</div> :
          filteredItems.map((task: any) => (
            <div key={task.id} className={`flex items-center gap-4 bg-[var(--surface)] p-4 rounded-lg border ${task.status === 'COMPLETED' ? 'border-[var(--accent)]/30 opacity-60' : 'border-[var(--border)]'}`}>
              <button onClick={() => toggleComplete(task)} className="text-[var(--accent)] hover:scale-110 transition-transform">
                {task.status === 'COMPLETED' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </button>
              <div className="flex-1">
                <h3 className={`font-bold ${task.status === 'COMPLETED' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>{task.title}</h3>
                {task.description && <p className="text-sm text-[var(--text-muted)] mt-1">{task.description}</p>}
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-[var(--surface-3)] text-[var(--text-muted)]">{task.priority}</span>
                  {task.dueDate && <span className="px-2 py-0.5 rounded bg-[var(--surface-3)] text-[var(--text-muted)]">Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingTask(task); setIsModalOpen(true); }} className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] rounded hover:bg-[var(--surface-3)]"><Edit2 size={16} /></button>
                <button onClick={() => { if(window.confirm('Delete task?')) remove(task.id); }} className="p-2 text-[var(--text-muted)] hover:text-[var(--danger)] rounded hover:bg-[var(--danger)]/10"><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        }
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)] w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">{editingTask ? 'Edit Task' : 'New Task'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Title</label>
                <input required name="title" defaultValue={editingTask?.title} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Description</label>
                <textarea name="description" defaultValue={editingTask?.description} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Status</label>
                  <select name="status" defaultValue={editingTask?.status || 'TODO'} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none">
                    <option value="BACKLOG">Backlog</option>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Priority</label>
                  <select name="priority" defaultValue={editingTask?.priority || 'MEDIUM'} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none">
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Due Date</label>
                <input type="date" name="dueDate" defaultValue={editingTask?.dueDate?.split('T')[0]} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded text-[var(--text-muted)] hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-[var(--accent)] text-black font-bold hover:brightness-110">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
