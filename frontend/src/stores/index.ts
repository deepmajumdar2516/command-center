import { create } from 'zustand';
import { api } from '../services/api';
import { useToast } from '../components/Toaster';

export function createCrudStore<T extends { id: string }>(resource: keyof typeof api) {
  return create<any>((set: any) => ({
    items: [] as T[],
    loading: false,
    error: null,
    fetch: async () => {
      set({ loading: true, error: null });
      try {
        const items = await (api[resource] as any).getAll();
        set({ items, loading: false });
      } catch (error: any) {
        set({ error: error.message, loading: false });
        useToast.getState().addToast(`Failed to fetch ${resource}`, 'error');
      }
    },
    add: async (data: Partial<T>) => {
      try {
        const item = await (api[resource] as any).create(data);
        set((state: any) => ({ items: [...state.items, item] }));
        api.activity.create({
          type: 'CREATE',
          message: `Created ${resource.replace(/s$/, '')}: ${(data as any).title || (data as any).name || (data as any).company || 'Item'}`,
          entityId: item.id,
          entityType: resource
        }).catch(console.error);
        useToast.getState().addToast(`${resource.replace(/s$/, '')} created`, 'success', undefined, `${resource}-create`);
      } catch (error: any) {
        set({ error: error.message });
        useToast.getState().addToast(`Failed to create ${resource.replace(/s$/, '')}`, 'error', undefined, `${resource}-create`);
      }
    },
    update: async (id: string, data: Partial<T>) => {
      useToast.getState().addToast(`Saving...`, 'info', undefined, `${resource}-update-${id}`);
      try {
        const updated = await (api[resource] as any).update(id, data);
        set((state: any) => ({
          items: state.items.map((i: any) => (i.id === id ? updated : i)),
        }));
        api.activity.create({
          type: 'UPDATE',
          message: `Updated ${resource.replace(/s$/, '')}: ${(data as any).title || (data as any).name || (data as any).company || 'Item'}`,
          entityId: id,
          entityType: resource
        }).catch(console.error);
        useToast.getState().addToast(`Saved successfully`, 'success', undefined, `${resource}-update-${id}`);
      } catch (error: any) {
        set({ error: error.message });
        useToast.getState().addToast(`Failed to update ${resource.replace(/s$/, '')}`, 'error', undefined, `${resource}-update-${id}`);
      }
    },
    remove: async (id: string) => {
      try {
        await (api[resource] as any).delete(id);
        set((state: any) => ({
          items: state.items.filter((i: any) => i.id !== id),
        }));
        api.activity.create({
          type: 'DELETE',
          message: `Deleted ${resource.replace(/s$/, '')}`,
          entityId: id,
          entityType: resource
        }).catch(console.error);
        useToast.getState().addToast(`${resource.replace(/s$/, '')} deleted`, 'info', {
          label: 'UNDO',
          onClick: async () => {

            await (api[resource] as any).restore(id);
            const items = await (api[resource] as any).getAll();
            set({ items });
          }
        }, `${resource}-delete-${id}`);
      } catch (error: any) {
        set({ error: error.message });
        useToast.getState().addToast(`Failed to delete ${resource.replace(/s$/, '')}`, 'error', undefined, `${resource}-delete-${id}`);
      }
    },
    restoreItem: async (id: string) => {
      try {
        await (api[resource] as any).restore(id);
        const items = await (api[resource] as any).getAll();
        set({ items });
      } catch(e) {
        console.error(e);
      }
    },
    hardRemove: async (id: string) => {
      try {
        await (api[resource] as any).hardDelete(id);
      } catch(e) {
        console.error(e);
      }
    }
  }));
}

export const useTasks = createCrudStore('tasks');
export const useProjects = createCrudStore('projects');
export const useProjects2 = createCrudStore('projects2');
export const useProject2Files = createCrudStore('project2Files');
export const useProject2Links = createCrudStore('project2Links');
export const useNotes = createCrudStore('notes');
export const useCalendar = createCrudStore('calendar');
export const useIdeas = createCrudStore('ideas');
export const useApplications = createCrudStore('applications');
export const useLearning = createCrudStore('learning');
export const useWorksheets = createCrudStore('worksheets');
export const useGoals = createCrudStore('goals');
export const useActivity = createCrudStore('activity');
export const useWhiteboards = createCrudStore('whiteboards');
export const useWhiteboards2 = createCrudStore('whiteboards2');
export const useNotifications = createCrudStore('notifications');

export const useSettings = create<{
  settings: any;
  loading: boolean;
  fetch: () => Promise<void>;
  update: (data: any) => Promise<void>;
}>((set) => ({
  settings: null,
  loading: false,
  fetch: async () => {
    set({ loading: true });
    try {
      const data = await api.settings.get();
      set({ settings: data, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },
  update: async (data: any) => {
    const updated = await api.settings.update(data);
    set({ settings: updated });
  }
}));

export const useSystem = create<{
  databaseStatus: 'connected' | 'offline' | 'checking';
  setDatabaseStatus: (status: 'connected' | 'offline' | 'checking') => void;
  checkHealth: () => Promise<boolean>;
}>((set) => ({
  databaseStatus: 'checking',
  setDatabaseStatus: (status) => set({ databaseStatus: status }),
  checkHealth: async () => {
    try {
      await api.health();
      set({ databaseStatus: 'connected' });
      return true;
    } catch {
      set({ databaseStatus: 'offline' });
      return false;
    }
  }
}));

export const refreshAllStores = () => {
  useTasks.getState().fetch();
  useProjects.getState().fetch();
  useProjects2.getState().fetch();
  useNotes.getState().fetch();
  useCalendar.getState().fetch();
  useIdeas.getState().fetch();
  useApplications.getState().fetch();
  useLearning.getState().fetch();
  useWorksheets.getState().fetch();
  useGoals.getState().fetch();
  useActivity.getState().fetch();
  useWhiteboards.getState().fetch();
  useWhiteboards2.getState().fetch();
  useNotifications.getState().fetch();
};
