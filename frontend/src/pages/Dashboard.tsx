import React, { useEffect } from 'react';
import { useTasks, useProjects, useGoals, useApplications, useActivity } from '../stores';
import { CheckCircle2, Circle, Activity as ActivityIcon } from 'lucide-react';
import { AnalyticsCharts } from '../components/AnalyticsCharts';

export function Dashboard() {
  const { items: tasks, fetch: fetchTasks, update: updateTask } = useTasks();
  const { items: projects, fetch: fetchProjects } = useProjects();
  const { items: goals, fetch: fetchGoals } = useGoals();
  const { items: applications, fetch: fetchApps } = useApplications();
  const { items: activities, fetch: fetchActivities } = useActivity();

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchGoals();
    fetchApps();
    fetchActivities();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) return 'Good night';
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  };

  const activeTasks = tasks.filter((t: any) => t.status !== 'COMPLETED' && !t.archived);
  const activeProjects = projects.filter((p: any) => p.status === 'ACTIVE' || p.status === 'PLANNING');
  const activeApps = applications.filter((a: any) => a.status !== 'REJECTED' && a.status !== 'WITHDRAWN');
  const activeGoals = goals.filter((g: any) => g.status === 'ACTIVE');

  const topTasks = [...activeTasks].sort((a: any, b: any) => {
    const pVal = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    return (pVal[b.priority as keyof typeof pVal] || 0) - (pVal[a.priority as keyof typeof pVal] || 0);
  }).slice(0, 5);

  const recentActivity = [...activities].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6);

  return (
    <div className="h-full flex flex-col space-y-6 overflow-y-auto">
      <div>
        <h1 className="text-3xl font-bold font-mono text-[var(--text-primary)]">Deep // COMMAND CENTER</h1>
        <p className="text-[var(--text-muted)] text-lg">{getGreeting()}, admin.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Tasks', count: activeTasks.length, color: 'var(--accent)' },
          { label: 'Active Projects', count: activeProjects.length, color: 'var(--info)' },
          { label: 'Active Applications', count: activeApps.length, color: 'var(--warning)' },
          { label: 'Active Goals', count: activeGoals.length, color: 'var(--purple)' },
        ].map(stat => (
          <div key={stat.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 flex flex-col justify-between hover:border-[var(--text-muted)] transition-colors">
            <span className="text-sm text-[var(--text-muted)] font-bold">{stat.label}</span>
            <span className="text-4xl font-mono font-bold mt-2" style={{ color: stat.color }}>{stat.count}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Top Tasks */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
            <h2 className="font-bold text-lg mb-4 text-[var(--accent)]">Top Priority Tasks</h2>
            <div className="space-y-2">
              {topTasks.length === 0 ? <p className="text-[var(--text-muted)] text-sm">No active tasks.</p> : 
               topTasks.map((task: any) => (
                 <div key={task.id} className="flex justify-between items-center bg-[var(--surface-2)] p-3 rounded border border-[var(--border)]">
                   <div className="flex items-center gap-3">
                     <button onClick={() => updateTask(task.id, { status: 'COMPLETED', completedAt: new Date().toISOString() })} className="text-[var(--text-muted)] hover:text-[var(--accent)]"><Circle size={18}/></button>
                     <div>
                       <div className="font-bold text-sm text-[var(--text-primary)]">{task.title}</div>
                       <div className="text-xs text-[var(--text-dim)]">{task.category || 'No Category'}</div>
                     </div>
                   </div>
                   <div className="flex gap-2 text-xs">
                     <span className={`px-2 py-0.5 rounded ${task.priority === 'CRITICAL' ? 'bg-[var(--danger)]/20 text-[var(--danger)]' : 'bg-[var(--surface-3)] text-[var(--text-muted)]'}`}>{task.priority}</span>
                     <span className="px-2 py-0.5 rounded bg-[var(--surface-3)] text-[var(--text-muted)]">{task.status}</span>
                   </div>
                 </div>
               ))
              }
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Projects */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
              <h2 className="font-bold mb-4 text-[var(--info)]">Active Projects</h2>
              <div className="space-y-3">
                {activeProjects.slice(0, 4).map((project: any) => (
                  <div key={project.id} className="bg-[var(--surface-2)] p-3 rounded border border-[var(--border)]">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold">{project.name}</span>
                      <span className="text-[var(--info)] font-mono">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--surface-3)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--info)]" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Goals */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
              <h2 className="font-bold mb-4 text-[var(--purple)]">Active Goals</h2>
              <div className="space-y-3">
                {activeGoals.slice(0, 4).map((goal: any) => (
                  <div key={goal.id} className="bg-[var(--surface-2)] p-3 rounded border border-[var(--border)]">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold">{goal.name}</span>
                      <span className="text-[var(--purple)] font-mono">{goal.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--surface-3)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--purple)]" style={{ width: `${goal.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 flex flex-col h-full">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><ActivityIcon size={18} className="text-[var(--text-muted)]"/> Activity Feed</h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {recentActivity.length === 0 ? <p className="text-[var(--text-muted)] text-sm">No recent activity.</p> :
             recentActivity.map((log: any) => (
               <div key={log.id} className="flex gap-3 relative before:absolute before:left-2 before:top-6 before:bottom-[-16px] before:w-px before:bg-[var(--border)] last:before:hidden">
                 <div className={`w-4 h-4 rounded-full mt-1 flex-shrink-0 z-10 ${
                   log.type === 'CREATE' ? 'bg-[var(--accent)]' :
                   log.type === 'UPDATE' ? 'bg-[var(--info)]' :
                   log.type === 'DELETE' ? 'bg-[var(--danger)]' : 'bg-[var(--text-muted)]'
                 }`} />
                 <div>
                   <div className="text-sm text-[var(--text-primary)]">{log.message}</div>
                   <div className="text-xs text-[var(--text-dim)] font-mono mt-0.5">
                     {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                   </div>
                 </div>
               </div>
             ))
            }
          </div>
        </div>
      </div>

      <div className="mt-4">
        <AnalyticsCharts />
      </div>
    </div>
  );
}
