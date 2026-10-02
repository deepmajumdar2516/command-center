import React, { useState, useEffect, useRef } from 'react';
import { Search, Folder, CheckSquare, Calendar, FileText, Lightbulb, Briefcase, BookOpen, Target, Settings, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../services/api';

const ICONS: Record<string, React.ReactNode> = {
  task: <CheckSquare size={16} />,
  project: <Folder size={16} />,
  note: <FileText size={16} />,
  idea: <Lightbulb size={16} />,
  application: <Briefcase size={16} />,
  learning: <BookOpen size={16} />,
  goal: <Target size={16} />,
  calendarEvent: <Calendar size={16} />
};

const PATHS: Record<string, string> = {
  task: '/tasks',
  project: '/projects',
  note: '/notes',
  idea: '/ideas',
  application: '/applications',
  learning: '/learning',
  goal: '/goals',
  calendarEvent: '/calendar'
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setSelectedIndex(0);
      } catch (err) {
        console.error("Search error", err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      selectResult(results[selectedIndex]);
    }
  };

  const selectResult = (result: any) => {
    setOpen(false);
    navigate(PATHS[result.type] || '/');
    // We could ideally open the exact item if we implement deep linking or modals, 
    // but navigating to the page is the first step.
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh]">
      <div 
        className="bg-[var(--surface)] w-full max-w-2xl rounded-xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-[var(--border)]">
          <Search size={20} className="text-[var(--text-muted)] mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search across all modules... (Ctrl+K)"
            className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] text-lg placeholder:text-[var(--text-muted)]"
          />
          <button onClick={() => setOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.length > 0 && results.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">No results found for "{query}"</div>
          ) : (
            <div className="p-2">
              {results.map((r, i) => (
                <div
                  key={`${r.type}-${r.id}`}
                  onClick={() => selectResult(r)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${i === selectedIndex ? 'bg-[var(--accent)] text-black' : 'hover:bg-[var(--surface-3)] text-[var(--text-primary)]'}`}
                >
                  <div className={`p-2 rounded-lg mr-4 ${i === selectedIndex ? 'bg-black/20 text-black' : 'bg-[var(--surface-3)] text-[var(--accent)]'}`}>
                    {ICONS[r.type]}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">{r.title}</div>
                    <div className={`text-xs ${i === selectedIndex ? 'text-black/70' : 'text-[var(--text-muted)]'}`}>
                      {r.type.toUpperCase()} • {r.subtitle}
                    </div>
                  </div>
                  <ChevronRight size={16} className={i === selectedIndex ? 'opacity-100' : 'opacity-0'} />
                </div>
              ))}
            </div>
          )}
          
          {query.length === 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Quick Links</div>
              {Object.keys(PATHS).map((type, i) => (
                <div
                  key={type}
                  onClick={() => { setOpen(false); navigate(PATHS[type]); }}
                  className="flex items-center px-3 py-2 rounded-lg cursor-pointer hover:bg-[var(--surface-3)] text-[var(--text-primary)]"
                >
                  <span className="mr-3 text-[var(--accent)]">{ICONS[type]}</span>
                  <span className="capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
