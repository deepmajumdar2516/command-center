import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Save } from 'lucide-react';
import { api } from '../services/api';

export function Workspace() {
  const [scratchpad, setScratchpad] = useState('# Workspace Scratchpad\n\nStart typing here...');
  const [terminalHistory, setTerminalHistory] = useState<{ type: 'input' | 'output', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  const saveScratchpad = async () => {
    setSaving(true);
    // Persist to Postgres via Settings/Global store (or dedicated scratchpad API)
    // For now, we use a dedicated Settings object "scratchpad"
    try {
      await api.settings.update({ scratchpad });
    } catch(e) {}
    setTimeout(() => setSaving(false), 500);
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim();
    setTerminalHistory(prev => [...prev, { type: 'input', text: cmd }]);
    
    let output = '';
    switch (cmd.toLowerCase()) {
      case 'status':
        output = 'SYSTEM ONLINE\nDATABASE CONNECTED\nALL SYSTEMS NOMINAL';
        break;
      case 'ls':
        output = 'projects/\ntasks/\nnotes/\nideas/';
        break;
      case 'clear':
        setTerminalHistory([]);
        setInput('');
        return;
      case 'date':
        output = new Date().toString();
        break;
      case 'whoami':
        output = 'admin (Deep Command Center)';
        break;
      case 'help':
        output = 'Available commands: status, ls, clear, date, whoami, help';
        break;
      default:
        output = `Command not found: ${cmd}`;
    }

    setTerminalHistory(prev => [...prev, { type: 'output', text: output }]);
    setInput('');
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-mono text-[var(--accent)]">Workspace</h1>
        <button onClick={saveScratchpad} className="flex items-center gap-2 bg-[var(--surface-3)] text-white px-4 py-2 rounded font-bold hover:brightness-110">
          <Save size={16} className={saving ? "text-[var(--accent)]" : ""} /> {saving ? 'Saved' : 'Save Scratchpad'}
        </button>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left: Scratchpad */}
        <div className="flex-1 flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded overflow-hidden">
          <div className="p-2 border-b border-[var(--border)] bg-[var(--surface-2)] text-xs font-mono text-[var(--text-muted)] flex items-center gap-2">
            SCRATCHPAD.md
          </div>
          <textarea
            value={scratchpad}
            onChange={(e) => setScratchpad(e.target.value)}
            onBlur={saveScratchpad}
            className="flex-1 w-full bg-transparent p-4 outline-none text-[var(--text-primary)] resize-none font-mono text-sm"
          />
        </div>

        {/* Right: Terminal */}
        <div className="flex-1 flex flex-col bg-[#0a0a0f] border border-[var(--border)] rounded overflow-hidden">
          <div className="p-2 border-b border-[var(--border)] bg-[var(--surface-2)] text-xs font-mono text-[var(--text-muted)] flex items-center gap-2">
            <Terminal size={12}/> TERMINAL
          </div>
          <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-1">
            <div className="text-[var(--accent)] mb-4">Deep // OS Terminal v1.0.0</div>
            {terminalHistory.map((line, i) => (
              <div key={i} className={`${line.type === 'input' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] whitespace-pre-wrap'}`}>
                {line.type === 'input' ? <><span className="text-[var(--accent)]">➜</span> <span className="text-[var(--info)]">~</span> {line.text}</> : line.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleCommand} className="p-4 border-t border-[var(--border)]/50 flex items-center gap-2 font-mono text-sm">
            <span className="text-[var(--accent)]">➜</span>
            <span className="text-[var(--info)]">~</span>
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[var(--text-primary)]"
              autoFocus
            />
          </form>
        </div>
      </div>
    </div>
  );
}
