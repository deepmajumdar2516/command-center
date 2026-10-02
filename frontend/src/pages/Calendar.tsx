import React, { useEffect, useState } from 'react';
import { useCalendar } from '../stores';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2 } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, addDays, isSameMonth, isSameDay, subMonths, addMonths } from 'date-fns';

const COLORS = ['#00d4aa', '#4488ff', '#aa66ff', '#ff4466', '#ffaa00'];

export function Calendar() {
  const { items, fetch, add, update, remove, loading } = useCalendar();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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
    
    if (editingEvent) update(editingEvent.id, data);
    else add(data);
    
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const openNewEventModal = (d: Date) => {
    setSelectedDate(d);
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold font-mono text-[var(--accent)]">Calendar</h1>
          <div className="flex bg-[var(--surface-3)] rounded items-center p-1">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:text-[var(--accent)]"><ChevronLeft size={20}/></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 font-bold text-sm hover:text-[var(--accent)]">Today</button>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:text-[var(--accent)]"><ChevronRight size={20}/></button>
          </div>
          <h2 className="text-lg font-bold ml-4">{format(currentDate, 'MMMM yyyy')}</h2>
        </div>
        <button onClick={() => openNewEventModal(new Date())} className="flex items-center gap-2 bg-[var(--accent)] text-black px-4 py-2 rounded font-bold hover:brightness-110">
          <Plus size={16} /> New Event
        </button>
      </div>

      <div className="flex-1 flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface-2)]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-bold text-[var(--text-muted)]">{day}</div>
          ))}
        </div>
        
        <div className="flex-1 grid grid-cols-7 grid-rows-5">
          {days.map((day, i) => {
            const dayEvents = items.filter((evt: any) => isSameDay(new Date(evt.start), day));
            const isToday = isSameDay(day, new Date());
            
            return (
              <div 
                key={day.toString()} 
                onClick={() => openNewEventModal(day)}
                className={`min-h-[100px] border-r border-b border-[var(--border)]/50 p-1 flex flex-col hover:bg-[var(--surface-2)] cursor-pointer
                  ${!isSameMonth(day, monthStart) ? 'opacity-30 bg-black/20' : ''}
                  ${isToday ? 'bg-[var(--accent)]/20 shadow-[inset_0_0_0_1px_var(--accent)]' : ''}
                `}
              >
                <div className={`text-right p-1 text-sm ${isToday ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-primary)]'}`}>
                  {format(day, 'd')}
                </div>
                <div className="flex-1 overflow-y-auto space-y-1">
                  {dayEvents.map((evt: any) => (
                    <div 
                      key={evt.id} 
                      onClick={(e) => { e.stopPropagation(); setEditingEvent(evt); setIsModalOpen(true); }}
                      className="text-xs p-1 rounded truncate text-white border border-white/10"
                      style={{ backgroundColor: evt.color || '#4488ff' }}
                    >
                      {format(new Date(evt.start), 'HH:mm')} {evt.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-[var(--surface)] p-6 rounded-lg border border-[var(--border)] w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">{editingEvent ? 'Edit Event' : 'New Event'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Title</label>
                <input required name="title" defaultValue={editingEvent?.title} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
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
                <textarea name="description" defaultValue={editingEvent?.description} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" rows={2} />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Color</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <label key={c} className="cursor-pointer">
                      <input type="radio" name="color" value={c} defaultChecked={(editingEvent?.color || COLORS[0]) === c} className="peer sr-only" />
                      <div className="w-8 h-8 rounded-full border-2 border-transparent peer-checked:border-white" style={{ backgroundColor: c }} />
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[var(--border)]">
              {editingEvent && <button type="button" onClick={() => { if(window.confirm('Delete event?')) { remove(editingEvent.id); setIsModalOpen(false); } }} className="mr-auto px-4 py-2 rounded text-[var(--danger)] hover:bg-[var(--danger)]/10">Delete</button>}
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded text-[var(--text-muted)] hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-[var(--accent)] text-black font-bold hover:brightness-110">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
