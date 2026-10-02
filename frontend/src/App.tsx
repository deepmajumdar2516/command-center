import { useEffect, useState } from 'react';
import { useSystem, useSettings, refreshAllStores } from './stores';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Terminal, CheckSquare, Folder, FileText, Calendar as CalIcon, 
  Lightbulb, Briefcase, BookOpen, Table, Target, Activity as ActivityIcon, Settings as SettingsIcon, LayoutDashboard, Monitor, Trash2, Menu
} from 'lucide-react';
import { GenericModule } from './pages/GenericModule';
import { Dashboard } from './pages/Dashboard';
import { Whiteboard } from './pages/Whiteboard';
import { Whiteboard2 } from './pages/Whiteboard2';
import { Projects2 } from './pages/Projects2';
import { Tasks } from './pages/Tasks';
import { Applications } from './pages/Applications';
import { Worksheets } from './pages/Worksheets';
import { Calendar } from './pages/Calendar';
import { Projects } from './pages/Projects';
import { Notes } from './pages/Notes';
import { Ideas } from './pages/Ideas';
import { Workspace } from './pages/Workspace';
import { Goals } from './pages/Goals';
import { Activity } from './pages/Activity';
import { Learning } from './pages/Learning';
import { Settings } from './pages/Settings';
import { Recovery } from './pages/Recovery';
import { Toaster, useToast } from './components/Toaster';
import { QuickCapture } from './components/QuickCapture';
import { CommandPalette } from './components/CommandPalette';
import { NotificationCenter } from './components/NotificationCenter';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/projects', label: 'Projects', icon: Folder },
  { path: '/projects2', label: 'Project2', icon: Folder },
  { path: '/workspace', label: 'Workspace', icon: Terminal },
  { path: '/notes', label: 'Notes', icon: FileText },
  { path: '/calendar', label: 'Calendar', icon: CalIcon },
  { path: '/worksheets', label: 'Worksheets', icon: Table },
  { path: '/whiteboard', label: 'Whiteboard', icon: Monitor },
  { path: '/whiteboard2', label: 'Whiteboard 2', icon: Monitor },
  { path: '/applications', label: 'Applications', icon: Briefcase },
  { path: '/learning', label: 'Learning', icon: BookOpen },
  { path: '/ideas', label: 'Idea Vault', icon: Lightbulb },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/activity', label: 'Activity', icon: ActivityIcon },
  { path: '/recovery', label: 'Recovery', icon: Trash2 },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { databaseStatus, checkHealth } = useSystem();
  const { settings, fetch: fetchSettings } = useSettings();
  const location = useLocation();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings?.accentColor) {
      document.documentElement.style.setProperty('--accent', settings.accentColor);
    }
  }, [settings]);

  useEffect(() => {
    let wasOffline = false;
    const interval = setInterval(async () => {
      const isConnected = await checkHealth();
      if (!isConnected) {
        wasOffline = true;
      } else if (wasOffline) {
        wasOffline = false;
        refreshAllStores();
        useToast.getState().addToast('Database connection restored. Data synchronized.', 'success');
      }
    }, 5000);

    checkHealth().then((ok) => {
      if (!ok) wasOffline = true;
    });

    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <div className="flex h-screen overflow-hidden text-sm bg-[var(--background)]">
      <div className={`${isSidebarOpen ? 'w-64 border-r border-[var(--border)]' : 'w-0 border-r-0'} transition-all duration-300 bg-[var(--surface)] flex flex-col overflow-hidden whitespace-nowrap`}>
        <div className="p-4 border-b border-[var(--border)]">
          <h1 className="font-mono text-lg tracking-wider text-[var(--accent)] font-bold">DEEP //</h1>
          <p className="text-xs text-[var(--text-muted)] tracking-widest uppercase">Command Center</p>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {navItems.map(item => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    active ? 'bg-[var(--surface-3)] text-[var(--accent)]' : 'text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-[var(--border)] text-xs font-mono space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span className="text-[var(--text-primary)]">SYSTEM ONLINE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${databaseStatus === 'connected' ? 'bg-[var(--accent)]' : 'bg-[var(--warning)] animate-pulse'}`} />
            <span className={databaseStatus === 'connected' ? 'text-[var(--text-primary)]' : 'text-[var(--warning)]'}>
              {databaseStatus === 'connected' ? 'DATABASE CONNECTED' : 'RECONNECTING...'}
            </span>
          </div>
          <div className="text-[var(--text-dim)] mt-2">v1.0.0</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute inset-0 grid-background opacity-20 pointer-events-none" />
        <div className="flex justify-between items-center px-8 py-4 relative z-20">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-[var(--surface)] border border-[var(--border)] rounded text-[var(--text-muted)] hover:text-white transition-colors"
            title="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
          <NotificationCenter />
        </div>
        <div className="flex-1 overflow-y-auto px-8 pb-8 relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { fetch: fetchSettings } = useSettings();

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects2" element={<Projects2 />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/worksheets" element={<Worksheets />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/recovery" element={<Recovery />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/whiteboard" element={<Whiteboard />} />
          <Route path="/whiteboard2" element={<Whiteboard2 />} />
        </Routes>
      </Layout>
      <Toaster />
      <QuickCapture />
      <CommandPalette />
    </HashRouter>
  );
}
