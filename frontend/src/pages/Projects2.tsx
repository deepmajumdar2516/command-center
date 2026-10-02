import React, { useEffect, useState, useRef } from 'react';
import { useProjects2, useProject2Files, useProject2Links, useTasks } from '../stores';
import { api, BASE_URL } from '../services/api';
import {
  Folder, Plus, Search, Filter, Calendar as CalIcon, Tag,
  Trash2, Edit2, Link as LinkIcon, FileText, CheckSquare, Clock, Paperclip, ExternalLink, Download
} from 'lucide-react';
import { format } from 'date-fns';

export function Projects2() {
  const { items: projects, fetch: fetchProjects, add: addProject, update: updateProject, remove: removeProject } = useProjects2();

  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={() => {
          setSelectedProject(null);
          fetchProjects(); // refresh list to get updated progress/counts
        }}
        onUpdate={async (data) => {
          await updateProject(selectedProject.id, data);
          setSelectedProject({ ...selectedProject, ...data });
        }}
        onDelete={async () => {
          if (window.confirm("Are you sure you want to delete this project?")) {
            await removeProject(selectedProject.id);
            setSelectedProject(null);
            fetchProjects();
          }
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    );
  }

  if (showCreate) {
    return (
      <CreateProjectView
        onCancel={() => setShowCreate(false)}
        onCreate={async (data) => {
          await addProject(data);
          setShowCreate(false);
          fetchProjects();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-[var(--text-primary)]">Project2 Workspace</h1>
          <p className="text-[var(--text-muted)] mt-1">Detailed personal project workspace</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-black rounded font-bold hover:brightness-110"
        >
          <Plus size={18} /> New Project
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded focus:border-[var(--accent)] outline-none text-white"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
          <Filter size={18} /> Filter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((p: any) => (
          <div
            key={p.id}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 cursor-pointer hover:border-[var(--accent)] transition-colors relative group flex flex-col"
            onClick={() => setSelectedProject(p)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-[var(--text-primary)] line-clamp-1 pr-2">{p.name}</h3>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs rounded font-mono ${p.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                    p.status === 'IN_PROGRESS' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' :
                      'bg-[var(--surface-3)] text-[var(--text-muted)]'
                  }`}>
                  {p.status}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete project?')) {
                      removeProject(p.id).then(() => fetchProjects());
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-400/20 rounded transition-opacity"
                  title="Delete Project"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <p className="text-[var(--text-muted)] text-sm mb-4 line-clamp-2 flex-1">{p.description || 'No description'}</p>

            <div className="space-y-3 mt-auto">
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span>Progress</span>
                <span>{p.progress || 0}%</span>
              </div>
              <div className="w-full bg-[var(--surface-3)] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[var(--accent)] h-full transition-all"
                  style={{ width: `${p.progress || 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1" title="Files"><Paperclip size={14} /> ?</span>
                  <span className="flex items-center gap-1" title="Links"><LinkIcon size={14} /> ?</span>
                </div>
                <span>{format(new Date(p.updatedAt), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
        ))}
        {filteredProjects.length === 0 && (
          <div className="col-span-full py-12 text-center text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-lg">
            No projects found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectDetail({ project, onBack, onUpdate, onDelete, activeTab, setActiveTab }: any) {
  const [content, setContent] = useState(project.detailedContent || '');
  const [tasksContent, setTasksContent] = useState(project.tasksContent || '');
  const [notesContent, setNotesContent] = useState(project.notesContent || '');
  const [timelineContent, setTimelineContent] = useState(project.timelineContent || '');
  const [saveStatus, setSaveStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const hasChanges = content !== (project.detailedContent || '') ||
                         tasksContent !== (project.tasksContent || '') ||
                         notesContent !== (project.notesContent || '') ||
                         timelineContent !== (project.timelineContent || '');
      
      if (hasChanges) {
        setSaveStatus('Saving...');
        onUpdate({ 
          detailedContent: content,
          tasksContent: tasksContent,
          notesContent: notesContent,
          timelineContent: timelineContent
        }).then(() => {
          setSaveStatus('Saved');
          setTimeout(() => setSaveStatus(''), 2000);
        });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [content, tasksContent, notesContent, timelineContent]);

  return (
    <div className="flex flex-col h-full bg-[var(--background)] -mx-8 -mb-8">
      {/* Header */}
      <div className="px-8 py-4 border-b border-[var(--border)] bg-[var(--surface)] flex flex-col gap-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-[var(--text-muted)] hover:text-white">← Back</button>
            <h1 className="text-2xl font-bold font-mono text-[var(--text-primary)]">{project.name}</h1>
            <span className="px-2 py-1 text-xs rounded font-mono bg-[var(--surface-3)] text-[var(--text-muted)]">{project.status}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-mono text-[var(--text-muted)]">
              {saveStatus && <span className="text-[var(--accent)]">{saveStatus}</span>}
            </div>
            <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 bg-[var(--surface-3)] hover:bg-[var(--surface-4)] text-white text-sm rounded flex items-center gap-2">
              Edit
            </button>
            <button onClick={onDelete} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded flex items-center gap-2">
              Delete
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-[var(--border)]">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<FileText size={16} />} label="Overview" />
          <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={<CheckSquare size={16} />} label="Tasks" />
          <TabButton active={activeTab === 'files'} onClick={() => setActiveTab('files')} icon={<Paperclip size={16} />} label="Files" />
          <TabButton active={activeTab === 'links'} onClick={() => setActiveTab('links')} icon={<LinkIcon size={16} />} label="Links" />
          <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={<FileText size={16} />} label="Notes" />
          <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} icon={<Clock size={16} />} label="Timeline" />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        {activeTab === 'overview' && (
          <div className="max-w-5xl mx-auto h-full flex flex-col">
            <div className="mb-4 text-[var(--text-muted)] flex items-center justify-between">
              <p>{project.description}</p>
            </div>
            <div className="flex-1 bg-white text-black rounded-lg overflow-hidden flex flex-col">
              <RichTextEditor value={content} onChange={setContent} />
            </div>
          </div>
        )}

        {activeTab === 'files' && <ProjectFiles projectId={project.id} />}
        {activeTab === 'links' && <ProjectLinks projectId={project.id} />}
        {activeTab === 'tasks' && (
          <div className="max-w-5xl mx-auto h-full flex flex-col">
            <div className="flex-1 bg-white text-black rounded-lg overflow-hidden flex flex-col">
              <RichTextEditor value={tasksContent} onChange={setTasksContent} />
            </div>
          </div>
        )}
        {activeTab === 'notes' && (
          <div className="max-w-5xl mx-auto h-full flex flex-col">
            <div className="flex-1 bg-white text-black rounded-lg overflow-hidden flex flex-col">
              <RichTextEditor value={notesContent} onChange={setNotesContent} />
            </div>
          </div>
        )}
        {activeTab === 'timeline' && (
          <div className="max-w-5xl mx-auto h-full flex flex-col">
            <div className="flex-1 bg-white text-black rounded-lg overflow-hidden flex flex-col">
              <RichTextEditor value={timelineContent} onChange={setTimelineContent} />
            </div>
          </div>
        )}
      </div>

      {isEditing && (
        <CreateProjectView 
          initialData={project}
          onCancel={() => setIsEditing(false)}
          onCreate={async (data: any) => {
            await onUpdate(data);
            setIsEditing(false);
          }}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${active
          ? 'border-[var(--accent)] text-[var(--accent)]'
          : 'border-transparent text-[var(--text-muted)] hover:text-white hover:border-[var(--surface-3)]'
        }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function RichTextEditor({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    handleInput();
    editorRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap gap-2 p-2 border-b border-gray-300 bg-gray-100 text-sm">
        <button type="button" onClick={() => exec('formatBlock', 'H1')} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 font-bold">H1</button>
        <button type="button" onClick={() => exec('formatBlock', 'H2')} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 font-bold">H2</button>
        <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
        <button type="button" onClick={() => exec('bold')} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 font-bold">B</button>
        <button type="button" onClick={() => exec('italic')} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 italic">I</button>
        <button type="button" onClick={() => exec('underline')} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 underline">U</button>
        <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
        <button type="button" onClick={() => exec('insertUnorderedList')} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50">• List</button>
        <button type="button" onClick={() => exec('insertOrderedList')} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50">1. List</button>
        <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
        <button type="button" onClick={() => {
          const url = prompt('Enter URL:');
          if (url) exec('createLink', url);
        }} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"><LinkIcon size={12} /> Link</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="flex-1 p-6 outline-none overflow-y-auto prose max-w-none"
        style={{ minHeight: '300px' }}
      />
    </div>
  );
}

// ----------------- FILES -----------------

function ProjectFiles({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.projects2.getFiles(projectId).then(res => {
      setFiles(res);
      setLoading(false);
    });
  }, [projectId]);

  const onFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    await handleFiles(droppedFiles);
  };

  const handleFiles = async (fileList: File[]) => {
    for (const f of fileList) {
      try {
        const newFile = await api.project2Files.upload(projectId, f);
        setFiles(prev => [...prev, newFile]);
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
  };

  const deleteFile = async (id: string) => {
    if (window.confirm("Delete file?")) {
      await api.project2Files.delete(id);
      setFiles(prev => prev.filter(f => f.id !== id));
    }
  };

  if (loading) return <div>Loading files...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onFileDrop}
        className="border-2 border-dashed border-[var(--border)] rounded-lg p-10 flex flex-col items-center justify-center text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-pointer"
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <Download size={32} className="mb-2" />
        <p className="font-bold">Click or drag files here to upload</p>
        <p className="text-sm opacity-70">Supports PDF, DOCX, Images, ZIP, etc.</p>
        <input
          id="file-upload"
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(Array.from(e.target.files));
          }}
        />
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[var(--surface-2)] border-b border-[var(--border)]">
            <tr>
              <th className="p-3 font-mono text-sm text-[var(--text-muted)]">Name</th>
              <th className="p-3 font-mono text-sm text-[var(--text-muted)]">Type</th>
              <th className="p-3 font-mono text-sm text-[var(--text-muted)]">Size</th>
              <th className="p-3 font-mono text-sm text-[var(--text-muted)] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map(f => (
              <tr key={f.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]">
                <td className="p-3 flex items-center gap-2">
                  <FileText size={16} className="text-[var(--text-muted)]" />
                  <span className="truncate max-w-[300px]">{f.name}</span>
                </td>
                <td className="p-3 text-sm text-[var(--text-muted)]">{f.type}</td>
                <td className="p-3 text-sm text-[var(--text-muted)]">{(f.size / 1024).toFixed(1)} KB</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <a href={f.url.startsWith('http') ? f.url : `${BASE_URL}${f.url}`} target="_blank" rel="noreferrer" className="p-1.5 text-blue-400 hover:bg-blue-400/20 rounded"><ExternalLink size={16} /></a>
                    <button onClick={() => deleteFile(f.id)} className="p-1.5 text-red-400 hover:bg-red-400/20 rounded"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {files.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-[var(--text-muted)]">No files attached to this project.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------- LINKS -----------------

function ProjectLinks({ projectId }: { projectId: string }) {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchLinks = () => {
    api.projects2.getLinks(projectId).then(res => {
      setLinks(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchLinks();
  }, [projectId]);

  const deleteLink = async (id: string) => {
    if (window.confirm("Delete link?")) {
      await api.project2Links.delete(id);
      fetchLinks();
    }
  };

  if (loading) return <div>Loading links...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-3)] hover:bg-[var(--surface-4)] text-white rounded">
          <Plus size={16} /> Add Link
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map(link => (
          <div key={link.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold flex items-center gap-2">
                <LinkIcon size={16} className="text-[var(--accent)]" />
                {link.title}
              </h3>
              <button onClick={() => deleteLink(link.id)} className="text-[var(--text-muted)] hover:text-red-400"><Trash2 size={14} /></button>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-3 flex-1">{link.description}</p>
            <a href={link.url} target="_blank" rel="noreferrer" className="text-[var(--accent)] text-sm flex items-center gap-1 hover:underline truncate">
              {link.url}
            </a>
          </div>
        ))}
      </div>

      {links.length === 0 && (
        <div className="py-12 text-center border border-dashed border-[var(--border)] rounded-lg text-[var(--text-muted)]">
          No links added yet. Connect your GitHub, Figma, Docs, etc.
        </div>
      )}

      {showAdd && (
        <AddLinkModal
          projectId={projectId}
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); fetchLinks(); }}
        />
      )}
    </div>
  );
}

function AddLinkModal({ projectId, onClose, onAdded }: any) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.project2Links.create({ projectId, title, url, description: desc, category });
    onAdded();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <form onSubmit={submit} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold mb-4">Add Link</h2>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">Title *</label>
            <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">URL *</label>
            <input required type="url" value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">Description</label>
            <input type="text" value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-white">
              <option value="">None</option>
              <option value="GitHub">GitHub</option>
              <option value="Documentation">Documentation</option>
              <option value="Website">Website</option>
              <option value="Figma">Figma</option>
              <option value="Video">Video</option>
              <option value="Drive">Drive</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[var(--text-muted)] hover:text-white">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-[var(--accent)] text-black font-bold rounded">Add Link</button>
        </div>
      </form>
    </div>
  );
}

// ----------------- MODALS -----------------

function CreateProjectView({ onCancel, onCreate, initialData }: any) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    status: initialData?.status || 'PLANNING',
    priority: initialData?.priority || 'MEDIUM',
    startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
    dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
    tags: initialData?.tags ? initialData.tags.join(', ') : ''
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    };
    onCreate(dataToSubmit);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)] -mx-8 -mb-8 overflow-y-auto">
      <div className="px-8 py-4 border-b border-[var(--border)] bg-[var(--surface)] flex items-center gap-4 sticky top-0 z-20">
        <button type="button" onClick={onCancel} className="text-[var(--text-muted)] hover:text-white">← Back</button>
        <h1 className="text-2xl font-bold font-mono text-[var(--text-primary)]">{initialData ? 'Edit Project' : 'Create Project2'}</h1>
      </div>

      <div className="p-8 max-w-3xl mx-auto w-full">
        <form onSubmit={submit} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 shadow-2xl">
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">Project Name *</label>
              <input required autoFocus type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-white outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">Short Description</label>
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-white outline-none focus:border-[var(--accent)] h-20 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">Status</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-white">
                  <option value="PLANNING">PLANNING</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">Priority</label>
                <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-white">
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">Start Date</label>
                <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">Due Date</label>
                <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">Category</label>
                <input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-white" placeholder="e.g. Work, Personal" />
              </div>
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] mb-1">Tags (comma separated)</label>
                <input type="text" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-white" placeholder="e.g. react, node, api" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border)]">
            <button type="button" onClick={onCancel} className="px-6 py-2 text-[var(--text-muted)] hover:text-white rounded">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-[var(--accent)] text-black font-bold rounded">{initialData ? 'Save Changes' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
