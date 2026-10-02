import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/Toaster';
import { useSettings } from '../stores';
import { Settings as SettingsIcon, Database, Key, User, Monitor, Save } from 'lucide-react';

export function Settings() {
  const { settings, update: updateSettings, fetch: fetchSettings } = useSettings();
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const { addToast } = useToast();

  useEffect(() => {
    fetchSettings();
    fetch('/api/health').then(r => r.json()).catch(() => ({ status: 'error', database: 'disconnected' }))
      .then(h => setDbStatus(h));
  }, [fetchSettings]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updates: any = {};
    formData.forEach((value, key) => {
      updates[key] = value;
    });
    
    try {
      await updateSettings({ ...settings, ...updates });
      addToast('Settings updated successfully', 'success');
    } catch (e) {
      addToast('Failed to update settings', 'error');
    }
  };

  if (!settings) return <div className="text-[var(--text-muted)]">Loading settings...</div>;

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-mono text-[var(--accent)] flex items-center gap-2"><SettingsIcon /> Settings</h1>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        <div className="w-64 flex flex-col gap-2">
          <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-2 px-4 py-3 rounded text-left font-bold transition-colors ${activeTab === 'profile' ? 'bg-[var(--surface-3)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}>
            <User size={18}/> User Profile
          </button>
          <button onClick={() => setActiveTab('preferences')} className={`flex items-center gap-2 px-4 py-3 rounded text-left font-bold transition-colors ${activeTab === 'preferences' ? 'bg-[var(--surface-3)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}>
            <Monitor size={18}/> Preferences
          </button>
          <button onClick={() => setActiveTab('apiKeys')} className={`flex items-center gap-2 px-4 py-3 rounded text-left font-bold transition-colors ${activeTab === 'apiKeys' ? 'bg-[var(--surface-3)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}>
            <Key size={18}/> API Keys
          </button>
          <button onClick={() => setActiveTab('database')} className={`flex items-center gap-2 px-4 py-3 rounded text-left font-bold transition-colors ${activeTab === 'database' ? 'bg-[var(--surface-3)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}>
            <Database size={18}/> Database Status
          </button>
          <button onClick={() => setActiveTab('backup')} className={`flex items-center gap-2 px-4 py-3 rounded text-left font-bold transition-colors ${activeTab === 'backup' ? 'bg-[var(--surface-3)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}>
            <Save size={18}/> Backup & Restore
          </button>
        </div>

        <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-8 overflow-y-auto">
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit} className="max-w-md space-y-4 animate-in fade-in">
              <h2 className="text-xl font-bold mb-6 border-b border-[var(--border)] pb-2">User Profile</h2>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Display Name</label>
                <input name="profile_name" defaultValue={settings.profile_name || 'admin'} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Email (Read Only)</label>
                <input disabled defaultValue="admin@deep.local" className="w-full bg-[var(--surface-3)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-muted)] outline-none opacity-50 cursor-not-allowed" />
              </div>
              <button type="submit" className="px-4 py-2 bg-[var(--accent)] text-black font-bold rounded hover:brightness-110 mt-4">Save Profile</button>
            </form>
          )}

          {activeTab === 'preferences' && (
            <form onSubmit={handleSubmit} className="max-w-md space-y-4 animate-in fade-in">
              <h2 className="text-xl font-bold mb-6 border-b border-[var(--border)] pb-2">Preferences</h2>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Theme</label>
                <select name="theme" defaultValue={settings.theme || 'dark'} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none">
                  <option value="dark">Dark Mode (Default)</option>
                  <option value="light">Light Mode</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Accent Color</label>
                <div className="flex items-center gap-4 mt-2">
                  <input type="color" name="accentColor" defaultValue={settings.accentColor || '#00d4aa'} className="w-12 h-12 p-1 bg-[var(--surface-2)] border border-[var(--border)] rounded cursor-pointer" />
                  <span className="text-xs text-[var(--text-muted)]">Changes the global website color</span>
                </div>
              </div>
              <button type="submit" className="px-4 py-2 bg-[var(--accent)] text-black font-bold rounded hover:brightness-110 mt-4">Save Preferences</button>
            </form>
          )}

          {activeTab === 'apiKeys' && (
            <form onSubmit={handleSubmit} className="max-w-md space-y-4 animate-in fade-in">
              <h2 className="text-xl font-bold mb-6 border-b border-[var(--border)] pb-2">API Keys</h2>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">OpenAI API Key</label>
                <input type="password" name="api_openai" defaultValue={settings.api_openai || ''} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">GitHub Personal Access Token</label>
                <input type="password" name="api_github" defaultValue={settings.api_github || ''} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] outline-none" />
              </div>
              <button type="submit" className="px-4 py-2 bg-[var(--accent)] text-black font-bold rounded hover:brightness-110 mt-4">Save API Keys</button>
            </form>
          )}

          {activeTab === 'database' && (
            <div className="max-w-md space-y-4 animate-in fade-in">
              <h2 className="text-xl font-bold mb-6 border-b border-[var(--border)] pb-2">Database Status</h2>
              
              <div className="bg-[var(--surface-2)] p-4 rounded border border-[var(--border)] flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)] font-bold">Connection</span>
                  {dbStatus?.database === 'connected' ? (
                    <span className="px-2 py-1 rounded bg-[var(--accent)]/20 text-[var(--accent)] text-xs font-bold font-mono">CONNECTED</span>
                  ) : (
                    <span className="px-2 py-1 rounded bg-[var(--danger)]/20 text-[var(--danger)] text-xs font-bold font-mono">OFFLINE</span>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)] font-bold">API Status</span>
                  {dbStatus?.status === 'ok' ? (
                    <span className="px-2 py-1 rounded bg-[var(--info)]/20 text-[var(--info)] text-xs font-bold font-mono">OK</span>
                  ) : (
                    <span className="px-2 py-1 rounded bg-[var(--danger)]/20 text-[var(--danger)] text-xs font-bold font-mono">ERROR</span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)] font-bold">PostgreSQL Provider</span>
                  <span className="text-white text-sm font-mono">Neon.tech Serverless</span>
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Database connection string is managed via backend/.env.</p>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="max-w-md space-y-4 animate-in fade-in">
              <h2 className="text-xl font-bold mb-6 border-b border-[var(--border)] pb-2">Global Backup & Restore</h2>
              <div className="p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded flex flex-col gap-2">
                <h3 className="font-bold text-[var(--text-primary)]">Export Full System</h3>
                <p className="text-sm text-[var(--text-muted)]">Download a complete JSON snapshot of your entire PostgreSQL database, including all modules, settings, and soft-deleted items.</p>
                <button 
                  onClick={() => api.backup.export()} 
                  className="px-4 py-2 bg-[var(--accent)] text-black font-bold rounded hover:brightness-110 mt-2 self-start"
                >
                  Download Backup
                </button>
              </div>

              <div className="p-4 bg-[var(--danger)]/10 border border-[var(--danger)]/50 rounded flex flex-col gap-2 mt-4">
                <h3 className="font-bold text-[var(--danger)]">Restore System</h3>
                <p className="text-sm text-[var(--text-muted)]">Upload a previously exported JSON backup. <strong className="text-[var(--danger)]">WARNING: This will wipe and replace your current database completely.</strong></p>
                <input 
                  type="file" 
                  accept=".json"
                  className="mt-2 text-sm text-[var(--text-primary)] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[var(--danger)] file:text-white hover:file:brightness-110"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!confirm("Are you absolutely sure? Your current data will be erased and replaced.")) return;
                    
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                      try {
                        const data = JSON.parse(e.target?.result as string);
                        await api.backup.import(data);
                        addToast('System restored successfully. Please refresh the page.', 'success');
                        setTimeout(() => window.location.reload(), 2000);
                      } catch (err) {
                        addToast('Restore failed: Invalid file format', 'error');
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
