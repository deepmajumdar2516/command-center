export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
export const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : (import.meta.env.PROD ? '' : 'http://localhost:5000');

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
}

export function createCrudApi<T>(resource: string) {
  return {
    getAll: () => apiFetch(`/${resource}`),
    getDeleted: () => apiFetch(`/${resource}?deleted=true`),
    getOne: (id: string) => apiFetch(`/${resource}/${id}`),
    create: (data: Partial<T>) => apiFetch(`/${resource}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<T>) => apiFetch(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => apiFetch(`/${resource}/${id}`, { method: 'DELETE' }),
    hardDelete: (id: string) => apiFetch(`/${resource}/${id}?permanent=true`, { method: 'DELETE' }),
    restore: (id: string) => apiFetch(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify({ deletedAt: null }) }),
  };
}

export const api = {
  tasks: createCrudApi('tasks'),
  projects: createCrudApi('projects'),
  projects2: {
    ...createCrudApi('projects2'),
    getFiles: (id: string) => apiFetch(`/projects2/${id}/files`),
    getLinks: (id: string) => apiFetch(`/projects2/${id}/links`),
  },
  project2Files: {
    ...createCrudApi('project2Files'),
    upload: async (projectId: string, file: File) => {
      const formData = new FormData();
      formData.append('projectId', projectId);
      formData.append('file', file);
      const response = await fetch(`${API_URL}/project2Files`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    }
  },
  project2Links: createCrudApi('project2Links'),
  notes: createCrudApi('notes'),
  calendar: createCrudApi('calendar'),
  ideas: createCrudApi('ideas'),
  applications: createCrudApi('applications'),
  learning: createCrudApi('learning'),
  worksheets: createCrudApi('worksheets'),
  goals: createCrudApi('goals'),
  activity: createCrudApi('activity'),
  whiteboards: createCrudApi('whiteboards'),
  whiteboards2: createCrudApi('whiteboards2'),
  notifications: {
    ...createCrudApi('notifications'),
    markAllRead: () => apiFetch('/notifications/mark-all-read', { method: 'POST' }),
    markRead: (id: string, read: boolean) => apiFetch(`/notifications/${id}/read`, { method: 'PUT', body: JSON.stringify({ read }) }),
  },
  analytics: {
    get: () => apiFetch('/analytics'),
  },
  backup: {
    export: () => window.open(`${API_URL}/backup/export`, '_blank'),
    import: (data: any) => apiFetch('/backup/import', { method: 'POST', body: JSON.stringify(data) }),
  },
  settings: {
    get: () => apiFetch('/settings'),
    update: (data: any) => apiFetch('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  },
  health: () => apiFetch('/health'),
};
