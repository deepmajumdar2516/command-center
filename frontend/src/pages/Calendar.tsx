import React, { useEffect, useState } from 'react';
import { useCalendar, useTasks } from '../stores';
import { 
  ChevronLeft, ChevronRight, Plus, Trash2, Edit2, CheckCircle2, 
  Circle, CheckSquare, Calendar as CalIcon, Clock, ExternalLink, X 
} from 'lucide-react';
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, 
  addDays, isSameMonth, isSameDay, subMonths, addMonths 
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { getTaskDate, extractDateFromText } from '../utils/dateExtractor';

const COLORS = ['#00d4aa', '#4488ff', '#aa66ff', '#ff4466', '#ffaa00'];

export function Calendar() {
  const { items: calendarEvents, fetch: fetchEvents, add: addEvent, update: updateEvent, remove: removeEvent } = useCalendar();
  const { items: tasks, fetch: fetchTasks, add: addTask, update: updateTask, remove: removeTask } = useTasks();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState<'ALL' | 'EVENTS' | 'TASKS'>('ALL');
  
  // Event Modal
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  
  // Task Creation Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');

  // Task Detail Modal
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchEvents();
    fetchTasks();
  }, []);

  const handleEventSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const startIso = new Date(`${formData.get('startDate')}T${formData.get('startTime')}`).toISOString();
    let endIso = startIso;
    if (formData.get('endDate') && formData.get('endTime')) {
      endIso = new Date(`${formData.get('endDate')}T${formData.get('endTime')}`).toISOString();
    }
    
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      start: startIso,
      end: endIso,
      color: formData.get('color') as string,
      notes: (formData.get('notes') as string) || '',
    };
    
    if (editingEvent) updateEvent(editingEvent.id, data);
    else addEvent(data);
    
    setIsEventModalOpen(false);
    setEditingEvent(null);
  };

  const handleTaskSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = (formData.get('description') as string) || '';
    const rawDueDate = formData.get('dueDate') as string;

    let dueDate: string | undefined;
    if (rawDueDate) {
      const [y, m, d] = rawDueDate.split('-').map(Number);
      dueDate = new Date(y, m - 1, d, 12, 0, 0).toISOString();
    } else {
      const extracted = extractDateFromText(`${title} ${description}`);
      if (extracted) {
        dueDate = extracted.toISOString();
      }
    }

    addTask({
      title,
      description,
      status: formData.get('status') as string || 'TODO',
      priority: formData.get('priority') as string || 'MEDIUM',
      dueDate,
    });

    setIsTaskModalOpen(false);
  };

  const toggleTaskComplete = (task: any) => {
    const isCompleted = task.status === 'COMPLETED';
    updateTask(task.id, {
      status: isCompleted ? 'TODO' : 'COMPLETED',
      completedAt: isCompleted ? null : new Date().toISOString(),
    });
    if (selectedTask?.id === task.id) {
      setSelectedTask({
        ...selectedTask,
        status: isCompleted ? 'TODO' : 'COMPLETED',
      });
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  // Count items this month
  const currentMonthTasks = tasks.filter((t: any) => {
    if (t.archived || t.deletedAt) return false;
    const d = getTaskDate(t);
    return d && isSameMonth(d, currentDate);
  });
  const currentMonthEvents = calendarEvents.filter((e: any) => {
    return e.start && isSameMonth(new Date(e.start), currentDate);
  });

  const openNewEventModal = (d: Date) => {
    setSelectedDate(d);
    setEditingEvent(null);
    setIsEventModalOpen(true);
  };

  const openNewTaskModal = (d: Date) => {
    setSelectedDate(d);
    setNewTaskDueDate(format(d, 'yyyy-MM-dd'));
    setIsTaskModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold font-mono text-[var(--accent)] flex items-center gap-2">
            <CalIcon size={24} /> Calendar
          </h1>
          <div className="flex bg-[var(--surface-3)] rounded items-center p-1">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:text-[var(--accent)] transition-colors"><ChevronLeft size={20}/></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 font-bold text-sm hover:text-[var(--accent)] transition-colors">Today</button>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:text-[var(--accent)] transition-colors"><ChevronRight size={20}/></button>
          </div>
          <h2 className="text-lg font-bold ml-2 text-[var(--text-primary)]">{format(currentDate, 'MMMM yyyy')}</h2>
        </div>

        {/* Filter & Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Filter Pills */}
          <div className="flex bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-1 text-xs">
            <button 
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded font-medium transition-colors ${filterType === 'ALL' ? 'bg-[var(--accent)] text-black font-bold' : 'text-[var(--text-muted)] hover:text-white'}`}
            >
              All ({currentMonthEvents.length + currentMonthTasks.length})
            </button>
            <button 
              onClick={() => setFilterType('EVENTS')}
              className={`px-3 py-1 rounded font-medium transition-colors ${filterType === 'EVENTS' ? 'bg-[var(--info)] text-black font-bold' : 'text-[var(--text-muted)] hover:text-white'}`}
            >
              Events ({currentMonthEvents.length})
            </button>
            <button 
              onClick={() => setFilterType('TASKS')}
              className={`px-3 py-1 rounded font-medium transition-colors ${filterType === 'TASKS' ? 'bg-[var(--accent)] text-black font-bold' : 'text-[var(--text-muted)] hover:text-white'}`}
            >
              Tasks ({currentMonthTasks.length})
            </button>
          </div>

          <button 
            onClick={() => openNewTaskModal(new Date())} 
            className="flex items-center gap-1.5 bg-[var(--surface-3)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] px-3 py-2 rounded font-bold text-xs transition-colors"
          >
            <CheckSquare size={15} /> + Task
          </button>
          <button 
            onClick={() => openNewEventModal(new Date())} 
            className="flex items-center gap-1.5 bg-[var(--accent)] text-black px-4 py-2 rounded font-bold text-xs hover:brightness-110 transition-colors shadow-sm"
          >
            <Plus size={15} /> + Event
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden shadow-lg">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface-2)]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="p-2 text-center text-xs font-mono font-bold text-[var(--text-muted)] tracking-wider uppercase">{d}</div>
          ))}
        </div>
        
        {/* Days Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5">
          {days.map((d) => {
            const isToday = isSameDay(d, new Date());
            const inCurrentMonth = isSameMonth(d, monthStart);

            // Filter events for this day
            const dayEvents = (filterType === 'ALL' || filterType === 'EVENTS') 
              ? calendarEvents.filter((evt: any) => evt.start && isSameDay(new Date(evt.start), d))
              : [];

            // Filter tasks for this day (by dueDate or extracted date)
            const dayTasks = (filterType === 'ALL' || filterType === 'TASKS')
              ? tasks.filter((t: any) => {
                  if (t.archived || t.deletedAt) return false;
                  const tDate = getTaskDate(t);
                  return tDate ? isSameDay(tDate, d) : false;
                })
              : [];

            return (
              <div 
                key={d.toISOString()} 
                onClick={() => openNewEventModal(d)}
                className={`min-h-[105px] border-r border-b border-[var(--border)]/40 p-1.5 flex flex-col hover:bg-[var(--surface-2)]/60 cursor-pointer transition-colors relative group
                  ${!inCurrentMonth ? 'opacity-30 bg-black/20' : ''}
                  ${isToday ? 'bg-[var(--accent)]/10 shadow-[inset_0_0_0_1px_var(--accent)]' : ''}
                `}
              >
                {/* Day Header */}
                <div className="flex justify-between items-center mb-1">
                  <span className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-[var(--text-dim)]">
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); openNewTaskModal(d); }} 
                      className="hover:text-[var(--accent)] px-1 rounded hover:bg-[var(--surface-3)]" 
                      title="Add task on this date"
                    >
                      +task
                    </button>
                  </span>
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${isToday ? 'bg-[var(--accent)] text-black font-bold' : 'text-[var(--text-primary)]'}`}>
                    {format(d, 'd')}
                  </span>
                </div>

                {/* Day Items Container */}
                <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 custom-scrollbar">
                  {/* Calendar Events */}
                  {dayEvents.map((evt: any) => (
                    <div 
                      key={`evt-${evt.id}`} 
                      onClick={(e) => { e.stopPropagation(); setEditingEvent(evt); setIsEventModalOpen(true); }}
                      className="text-xs p-1 rounded truncate text-white border border-white/10 hover:brightness-110 shadow-sm cursor-pointer transition-transform hover:scale-[1.01]"
                      style={{ backgroundColor: evt.color || '#4488ff' }}
                      title={`Event: ${evt.title} (${format(new Date(evt.start), 'HH:mm')})`}
                    >
                      <span className="font-mono text-[10px] opacity-80 mr-1">{format(new Date(evt.start), 'HH:mm')}</span>
                      <span>{evt.title}</span>
                    </div>
                  ))}

                  {/* Tasks on this Day */}
                  {dayTasks.map((task: any) => {
                    const isCompleted = task.status === 'COMPLETED';
                    const priorityBorder = 
                      task.priority === 'CRITICAL' ? 'border-l-red-500' :
                      task.priority === 'HIGH' ? 'border-l-orange-500' :
                      task.priority === 'MEDIUM' ? 'border-l-[var(--accent)]' : 'border-l-blue-400';

                    return (
                      <div 
                        key={`task-${task.id}`} 
                        onClick={(e) => { e.stopPropagation(); setSelectedTask(task); setIsEditingTask(false); }}
                        className={`text-xs p-1 pl-1.5 rounded truncate flex items-center gap-1.5 cursor-pointer transition-all border border-l-2 shadow-sm ${priorityBorder} ${
                          isCompleted 
                            ? 'bg-[var(--surface-3)]/60 text-[var(--text-muted)] line-through border-[var(--border)] opacity-60' 
                            : 'bg-[var(--accent)]/15 text-[var(--text-primary)] hover:bg-[var(--accent)]/25 border-[var(--accent)]/30 font-medium'
                        }`}
                        title={`Task: ${task.title} [${task.priority}] (${task.status}) - Click to view/edit`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskComplete(task);
                          }}
                          className="shrink-0 hover:scale-125 transition-transform"
                          title={isCompleted ? "Mark incomplete" : "Mark completed"}
                        >
                          {isCompleted ? <CheckCircle2 size={12} className="text-green-400" /> : <Circle size={12} className="text-[var(--accent)]" />}
                        </button>
                        <span className="truncate flex-1">{task.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Detail / Edit Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface-2)]">
              <div className="flex items-center gap-2">
                <CheckSquare size={18} className="text-[var(--accent)]" />
                <h2 className="font-bold text-lg text-[var(--text-primary)]">Task Details</h2>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-[var(--text-muted)] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className={`text-xl font-bold ${selectedTask.status === 'COMPLETED' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                    {selectedTask.title}
                  </h3>
                  {selectedTask.description && (
                    <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed whitespace-pre-wrap">
                      {selectedTask.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toggleTaskComplete(selectedTask)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    selectedTask.status === 'COMPLETED'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-[var(--accent)] text-black hover:brightness-110'
                  }`}
                >
                  {selectedTask.status === 'COMPLETED' ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                  {selectedTask.status === 'COMPLETED' ? 'Completed' : 'Mark Complete'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)] text-xs">
                <div>
                  <span className="text-[var(--text-muted)] block mb-1">Status</span>
                  <span className="font-mono px-2 py-0.5 rounded bg-[var(--surface-3)] text-[var(--text-primary)]">
                    {selectedTask.status}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block mb-1">Priority</span>
                  <span className={`font-mono px-2 py-0.5 rounded ${
                    selectedTask.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                    selectedTask.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                    selectedTask.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {selectedTask.priority}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block mb-1">Due Date</span>
                  <span className="font-mono text-[var(--accent)]">
                    {selectedTask.dueDate ? format(new Date(selectedTask.dueDate), 'MMMM d, yyyy') : (
                      getTaskDate(selectedTask) ? format(getTaskDate(selectedTask)!, 'MMMM d, yyyy') : 'No Date'
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block mb-1">Category</span>
                  <span className="text-[var(--text-primary)]">{selectedTask.category || 'None'}</span>
                </div>
              </div>

              {selectedTask.notes && (
                <div className="pt-2">
                  <span className="text-xs text-[var(--text-muted)] block mb-1">Notes:</span>
                  <p className="text-xs text-[var(--text-primary)] bg-[var(--surface-2)] p-2 rounded border border-[var(--border)]">{selectedTask.notes}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)] flex justify-between items-center">
              <button 
                type="button" 
                onClick={() => {
                  if (window.confirm('Delete this task?')) {
                    removeTask(selectedTask.id);
                    setSelectedTask(null);
                  }
                }}
                className="text-xs text-[var(--danger)] hover:underline flex items-center gap-1"
              >
                <Trash2 size={14} /> Delete Task
              </button>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setSelectedTask(null);
                    navigate('/tasks');
                  }} 
                  className="px-3 py-1.5 text-xs rounded bg-[var(--surface-3)] text-[var(--text-primary)] hover:bg-[var(--surface-4)] flex items-center gap-1"
                >
                  <ExternalLink size={14} /> View in Tasks
                </button>
                <button 
                  type="button" 
                  onClick={() => setSelectedTask(null)} 
                  className="px-4 py-1.5 text-xs rounded bg-[var(--accent)] text-black font-bold hover:brightness-110"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Task on Date Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleTaskSubmit} className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)] w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckSquare size={18} className="text-[var(--accent)]" /> New Task
              </h2>
              <button type="button" onClick={() => setIsTaskModalOpen(false)} className="text-[var(--text-muted)] hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Title *</label>
                <input required autoFocus name="title" placeholder="e.g. Finish report or Launch on Oct 25" className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Description</label>
                <textarea name="description" placeholder="Task details..." className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Status</label>
                  <select name="status" defaultValue="TODO" className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none">
                    <option value="BACKLOG">Backlog</option>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Priority</label>
                  <select name="priority" defaultValue="MEDIUM" className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none">
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Due Date</label>
                <input 
                  type="date" 
                  name="dueDate" 
                  defaultValue={newTaskDueDate} 
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" 
                />
                <span className="text-[11px] text-[var(--text-dim)] mt-1 block">Mentioning a date in the title will also set the date automatically.</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[var(--border)]">
              <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 rounded text-[var(--text-muted)] hover:text-white">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded bg-[var(--accent)] text-black font-bold hover:brightness-110">Create Task</button>
            </div>
          </form>
        </div>
      )}

      {/* New / Edit Event Modal */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleEventSubmit} className="bg-[var(--surface)] p-6 rounded-xl border border-[var(--border)] w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CalIcon size={18} className="text-[var(--info)]" /> {editingEvent ? 'Edit Event' : 'New Event'}
              </h2>
              <button type="button" onClick={() => setIsEventModalOpen(false)} className="text-[var(--text-muted)] hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Title</label>
                <input required name="title" defaultValue={editingEvent?.title} placeholder="Meeting, launch, etc." className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Start Date</label>
                  <input required type="date" name="startDate" defaultValue={editingEvent ? format(new Date(editingEvent.start), 'yyyy-MM-dd') : format(selectedDate, 'yyyy-MM-dd')} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">Start Time</label>
                  <input required type="time" name="startTime" defaultValue={editingEvent ? format(new Date(editingEvent.start), 'HH:mm') : '09:00'} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">End Date</label>
                  <input type="date" name="endDate" defaultValue={editingEvent?.end ? format(new Date(editingEvent.end), 'yyyy-MM-dd') : format(selectedDate, 'yyyy-MM-dd')} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-muted)] mb-1">End Time</label>
                  <input type="time" name="endTime" defaultValue={editingEvent?.end ? format(new Date(editingEvent.end), 'HH:mm') : '10:00'} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Description</label>
                <textarea name="description" defaultValue={editingEvent?.description} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" rows={2} />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Color</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <label key={c} className="cursor-pointer">
                      <input type="radio" name="color" value={c} defaultChecked={(editingEvent?.color || COLORS[0]) === c} className="peer sr-only" />
                      <div className="w-8 h-8 rounded-full border-2 border-transparent peer-checked:border-white transition-all shadow-sm" style={{ backgroundColor: c }} />
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[var(--border)]">
              {editingEvent && <button type="button" onClick={() => { if(window.confirm('Delete event?')) { removeEvent(editingEvent.id); setIsEventModalOpen(false); } }} className="mr-auto px-4 py-2 rounded text-[var(--danger)] hover:bg-[var(--danger)]/10 text-xs">Delete</button>}
              <button type="button" onClick={() => setIsEventModalOpen(false)} className="px-4 py-2 rounded text-[var(--text-muted)] hover:text-white text-xs">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded bg-[var(--accent)] text-black font-bold hover:brightness-110 text-xs">Save Event</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
