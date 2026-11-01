import React, { useEffect, useState, useMemo } from 'react';
import { api, BASE_URL } from '../services/api';
import { 
  Trash2, RotateCcw, ShieldAlert, CheckSquare, Folder, FileText, 
  Calendar as CalIcon, Lightbulb, Briefcase, BookOpen, Table as TableIcon, 
  Target, Monitor, File, ExternalLink, Image as ImageIcon, Eye, 
  Search, X, AlertTriangle, Check, ArrowUpDown
} from 'lucide-react';
import { useToast } from '../components/Toaster';
import { refreshAllStores } from '../stores';

interface DeletedItem {
  id: string;
  _type: string;
  _displayTitle: string;
  deletedAt: string;
  [key: string]: any;
}

const MODULE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  tasks: { label: 'Tasks', icon: CheckSquare, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  projects: { label: 'Projects', icon: Folder, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  projects2: { label: 'Projects V2', icon: Folder, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  project2Files: { label: 'Project Files', icon: File, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  project2Links: { label: 'Project Links', icon: ExternalLink, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  notes: { label: 'Notes', icon: FileText, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  calendar: { label: 'Calendar', icon: CalIcon, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  ideas: { label: 'Ideas', icon: Lightbulb, color: 'text-amber-300 bg-amber-400/10 border-amber-400/20' },
  applications: { label: 'Applications', icon: Briefcase, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  learning: { label: 'Learning', icon: BookOpen, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  worksheets: { label: 'Worksheets', icon: TableIcon, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  goals: { label: 'Goals', icon: Target, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  whiteboards: { label: 'Whiteboard', icon: Monitor, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  whiteboards2: { label: 'Whiteboard V2', icon: Monitor, color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20' },
};

function formatFileSize(bytes: number) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function Recovery() {
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<DeletedItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isOperating, setIsOperating] = useState(false);

  // Safe permanent deletion dialog state
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    itemsToDelete: DeletedItem[];
  }>({ isOpen: false, itemsToDelete: [] });

  const fetchDeleted = async () => {
    setLoading(true);
    try {
      const resources = [
        'tasks', 'projects', 'projects2', 'project2Files', 'project2Links',
        'notes', 'ideas', 'applications', 'learning', 'goals', 'calendar',
        'worksheets', 'whiteboards', 'whiteboards2'
      ];

      const results = await Promise.allSettled(
        resources.map(async (res) => {
          const apiEndpoint = (api as any)[res];
          if (!apiEndpoint || typeof apiEndpoint.getDeleted !== 'function') return [];
          const items = await apiEndpoint.getDeleted();
          if (!Array.isArray(items)) return [];
          return items
            .filter((i: any) => i && i.deletedAt)
            .map((i: any) => {
              let displayTitle = i.title || i.name;
              if (!displayTitle && i.company) {
                displayTitle = i.role ? `${i.role} at ${i.company}` : i.company;
              }
              if (!displayTitle && res === 'project2Files') {
                displayTitle = i.name || 'Uploaded File';
              }
              if (!displayTitle) {
                displayTitle = `Item in ${MODULE_CONFIG[res]?.label || res}`;
              }

              return {
                ...i,
                _type: res,
                _displayTitle: displayTitle,
              };
            });
        })
      );

      let allDeleted: DeletedItem[] = [];
      results.forEach((res) => {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          allDeleted = [...allDeleted, ...res.value];
        }
      });

      // Filter out any IDs currently selected that no longer exist
      setSelectedIds((prev) => {
        const validIds = new Set<string>();
        const itemKeys = new Set(allDeleted.map((i) => `${i._type}:${i.id}`));
        prev.forEach((key) => {
          if (itemKeys.has(key)) validIds.add(key);
        });
        return validIds;
      });

      setDeletedItems(allDeleted);
    } catch (e) {
      console.error('Failed to scan deleted items:', e);
      useToast.getState().addToast('Failed to load deleted items', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDeleted();
  }, []);

  // Filtered & sorted items
  const filteredItems = useMemo(() => {
    return deletedItems
      .filter((item) => {
        if (filterModule !== 'ALL' && item._type !== filterModule) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const title = (item._displayTitle || '').toLowerCase();
        const content = (item.content || item.description || item.notes || item.problem || item.solution || '').toLowerCase();
        const type = (item._type || '').toLowerCase();
        const category = (item.category || '').toLowerCase();
        return title.includes(q) || content.includes(q) || type.includes(q) || category.includes(q);
      })
      .sort((a, b) => {
        const timeA = new Date(a.deletedAt).getTime();
        const timeB = new Date(b.deletedAt).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [deletedItems, filterModule, searchQuery, sortOrder]);

  // Key generator to uniquely identify items across different modules
  const getItemKey = (item: DeletedItem) => `${item._type}:${item.id}`;

  // Selection handlers
  const toggleSelectItem = (item: DeletedItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const key = getItemKey(item);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      const allKeys = new Set(filteredItems.map(getItemKey));
      setSelectedIds(allKeys);
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Selected items objects
  const selectedItems = useMemo(() => {
    return deletedItems.filter((i) => selectedIds.has(getItemKey(i)));
  }, [deletedItems, selectedIds]);

  // Restore single item
  const handleRestoreSingle = async (item: DeletedItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsOperating(true);
    try {
      await (api as any)[item._type].restore(item.id);
      useToast.getState().addToast(`Restored "${item._displayTitle}" successfully`, 'success');
      
      // Remove from selected if it was selected
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(getItemKey(item));
        return next;
      });

      if (previewItem?.id === item.id && previewItem?._type === item._type) {
        setPreviewItem(null);
      }

      await fetchDeleted();
      refreshAllStores();
    } catch (e: any) {
      console.error(e);
      useToast.getState().addToast(`Failed to restore item: ${e.message}`, 'error');
    }
    setIsOperating(false);
  };

  // Bulk restore selected
  const handleBulkRestore = async () => {
    if (selectedItems.length === 0) return;
    setIsOperating(true);
    const count = selectedItems.length;
    let succeeded = 0;
    let failed = 0;

    for (const item of selectedItems) {
      try {
        await (api as any)[item._type].restore(item.id);
        succeeded++;
      } catch (err) {
        console.error(`Failed to restore ${item._displayTitle}:`, err);
        failed++;
      }
    }

    if (failed === 0) {
      useToast.getState().addToast(`Successfully restored all ${succeeded} selected item(s)`, 'success');
    } else {
      useToast.getState().addToast(`Restored ${succeeded} item(s), ${failed} failed`, 'warning');
    }

    setSelectedIds(new Set());
    if (previewItem && selectedItems.some((i) => i.id === previewItem.id && i._type === previewItem._type)) {
      setPreviewItem(null);
    }
    await fetchDeleted();
    refreshAllStores();
    setIsOperating(false);
  };

  // Initiate single delete confirmation
  const initiateSingleDelete = (item: DeletedItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteConfirmState({
      isOpen: true,
      itemsToDelete: [item],
    });
  };

  // Initiate bulk delete confirmation
  const initiateBulkDelete = () => {
    if (selectedItems.length === 0) return;
    setDeleteConfirmState({
      isOpen: true,
      itemsToDelete: selectedItems,
    });
  };

  // Execute confirmed permanent deletion
  const executePermanentDelete = async () => {
    const items = deleteConfirmState.itemsToDelete;
    if (items.length === 0) return;

    setIsOperating(true);
    const count = items.length;
    let succeeded = 0;
    let failed = 0;

    for (const item of items) {
      try {
        await (api as any)[item._type].hardDelete(item.id);
        succeeded++;
      } catch (err) {
        console.error(`Failed to permanently delete ${item._displayTitle}:`, err);
        failed++;
      }
    }

    if (failed === 0) {
      useToast.getState().addToast(
        count === 1 
          ? `Permanently deleted "${items[0]._displayTitle}"` 
          : `Permanently deleted ${succeeded} item(s)`,
        'info'
      );
    } else {
      useToast.getState().addToast(`Deleted ${succeeded} item(s), ${failed} failed`, 'warning');
    }

    // Clean selection
    const deletedKeys = new Set(items.map(getItemKey));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      deletedKeys.forEach((k) => next.delete(k));
      return next;
    });

    if (previewItem && deletedKeys.has(getItemKey(previewItem))) {
      setPreviewItem(null);
    }

    setDeleteConfirmState({ isOpen: false, itemsToDelete: [] });
    await fetchDeleted();
    refreshAllStores();
    setIsOperating(false);
  };

  // Keyboard shortcut to close preview on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteConfirmState.isOpen) {
          setDeleteConfirmState({ isOpen: false, itemsToDelete: [] });
        } else if (previewItem) {
          setPreviewItem(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteConfirmState.isOpen, previewItem]);

  const allFilteredSelected = filteredItems.length > 0 && selectedIds.size === filteredItems.length;
  const isPartiallySelected = selectedIds.size > 0 && !allFilteredSelected;

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-mono text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-3">
            <Trash2 className="text-[var(--danger)]" size={28} />
            Recovery Bin
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Review, preview, restore, or permanently purge discarded items.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDeleted}
            disabled={loading || isOperating}
            className="px-3 py-1.5 text-xs font-mono bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            title="Refresh recovery items"
          >
            <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-[var(--surface)] border border-[var(--border)] p-3 rounded-xl">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
          <input
            type="text"
            placeholder="Search deleted items by title, content, or metadata..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg pl-9 pr-8 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Module Filter Dropdown */}
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text-primary)] rounded-lg px-3 py-2 outline-none focus:border-[var(--accent)] cursor-pointer"
          >
            <option value="ALL">All Modules ({deletedItems.length})</option>
            {Object.entries(MODULE_CONFIG).map(([key, config]) => {
              const count = deletedItems.filter((i) => i._type === key).length;
              if (count === 0) return null;
              return (
                <option key={key} value={key}>
                  {config.label} ({count})
                </option>
              );
            })}
          </select>

          {/* Sort order toggle */}
          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--border-strong)] rounded-lg text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
            title={`Sort by deletion time: ${sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}`}
          >
            <ArrowUpDown size={14} />
            <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Toolbar - animates into view when items are selected */}
      {selectedIds.size > 0 && (
        <div className="bg-[var(--surface-2)] border-2 border-[var(--accent)]/50 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-black/40 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--accent)] text-black font-mono font-bold text-xs">
              {selectedIds.size}
            </span>
            <span className="font-semibold text-sm text-[var(--text-primary)]">
              {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} selected
            </span>
            <span className="text-[var(--text-dim)] hidden sm:inline">|</span>
            <button
              onClick={handleSelectAll}
              className="text-xs text-[var(--accent)] hover:underline font-mono"
            >
              {allFilteredSelected ? 'Deselect all' : 'Select all shown'}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleBulkRestore}
              disabled={isOperating}
              className="flex-1 sm:flex-initial px-4 py-2 bg-[var(--accent)] hover:brightness-110 text-black font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              <RotateCcw size={15} />
              <span>Restore Selected</span>
            </button>
            <button
              onClick={initiateBulkDelete}
              disabled={isOperating}
              className="flex-1 sm:flex-initial px-4 py-2 bg-[var(--danger)] hover:brightness-110 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              <Trash2 size={15} />
              <span>Delete Permanently</span>
            </button>
            <button
              onClick={handleClearSelection}
              className="px-3 py-2 bg-[var(--surface-3)] hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-white rounded-lg text-xs transition-colors"
              title="Clear selection"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Table / List Container */}
      <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col min-h-0">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-[var(--text-muted)] gap-3">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-sm">Scanning recovery registry across all modules...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-[var(--text-muted)]">
            <ShieldAlert size={48} className="mb-3 opacity-40 text-[var(--text-dim)]" />
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
              {searchQuery || filterModule !== 'ALL' ? 'No matching deleted items found' : 'Recovery Bin is Empty'}
            </h3>
            <p className="text-xs max-w-sm">
              {searchQuery || filterModule !== 'ALL'
                ? 'Try adjusting your search criteria or clearing the module filter.'
                : 'Items deleted across tasks, projects, notes, files, worksheets, and other modules will appear here for recovery.'}
            </p>
            {(searchQuery || filterModule !== 'ALL') && (
              <button
                onClick={() => { setSearchQuery(''); setFilterModule('ALL'); }}
                className="mt-4 px-3 py-1.5 bg-[var(--surface-2)] text-xs text-[var(--accent)] rounded-lg hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-[var(--surface-2)] sticky top-0 z-10 border-b border-[var(--border)]">
                <tr>
                  <th className="p-3.5 w-12 text-center">
                    <label className="relative flex items-center justify-center cursor-pointer p-1">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isPartiallySelected;
                        }}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-[var(--border-strong)] text-[var(--accent)] bg-[var(--surface-3)] focus:ring-[var(--accent)] cursor-pointer"
                        title="Select/Deselect all visible"
                      />
                    </label>
                  </th>
                  <th className="p-3.5 text-xs tracking-wider text-[var(--text-muted)] uppercase font-mono font-semibold">
                    Item Title & Preview
                  </th>
                  <th className="p-3.5 text-xs tracking-wider text-[var(--text-muted)] uppercase font-mono font-semibold w-40">
                    Module
                  </th>
                  <th className="p-3.5 text-xs tracking-wider text-[var(--text-muted)] uppercase font-mono font-semibold w-48">
                    Deleted At
                  </th>
                  <th className="p-3.5 text-right text-xs tracking-wider text-[var(--text-muted)] uppercase font-mono font-semibold w-56">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredItems.map((item) => {
                  const key = getItemKey(item);
                  const isSelected = selectedIds.has(key);
                  const moduleMeta = MODULE_CONFIG[item._type] || {
                    label: item._type,
                    icon: File,
                    color: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
                  };
                  const Icon = moduleMeta.icon;

                  // Snippet generator
                  const snippet =
                    item.content ||
                    item.description ||
                    item.notes ||
                    item.problem ||
                    item.solution ||
                    (item.url ? `URL: ${item.url}` : '') ||
                    '';
                  const cleanSnippet = snippet.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

                  return (
                    <tr
                      key={key}
                      onClick={() => setPreviewItem(item)}
                      className={`cursor-pointer transition-colors group ${
                        isSelected
                          ? 'bg-[var(--accent)]/10 hover:bg-[var(--accent)]/15'
                          : 'hover:bg-[var(--surface-2)]/80'
                      }`}
                    >
                      {/* Checkbox cell */}
                      <td 
                        className="p-3.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <label className="relative flex items-center justify-center cursor-pointer p-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleSelectItem(item, e as any)}
                            className="w-4 h-4 rounded border-[var(--border-strong)] text-[var(--accent)] bg-[var(--surface-3)] focus:ring-[var(--accent)] cursor-pointer"
                          />
                        </label>
                      </td>

                      {/* Title & snippet */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <Icon size={16} className="text-[var(--text-muted)] flex-shrink-0" />
                          <span className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                            {item._displayTitle}
                          </span>
                        </div>
                        {cleanSnippet && (
                          <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-1 pl-6 max-w-xl">
                            {cleanSnippet}
                          </p>
                        )}
                      </td>

                      {/* Module Badge */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border font-mono font-medium ${moduleMeta.color}`}
                        >
                          <Icon size={12} />
                          {moduleMeta.label}
                        </span>
                      </td>

                      {/* Deleted Date */}
                      <td className="p-3.5 text-xs text-[var(--text-muted)] font-mono">
                        {new Date(item.deletedAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Actions */}
                      <td 
                        className="p-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end items-center gap-1.5">
                          {/* Preview button */}
                          <button
                            onClick={() => setPreviewItem(item)}
                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] rounded-md transition-colors"
                            title="Preview item contents"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Restore button */}
                          <button
                            onClick={(e) => handleRestoreSingle(item, e)}
                            disabled={isOperating}
                            className="px-2.5 py-1.5 bg-[var(--accent)]/15 text-[var(--accent)] hover:bg-[var(--accent)]/25 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            title="Restore to original location"
                          >
                            <RotateCcw size={13} />
                            <span className="hidden sm:inline">Restore</span>
                          </button>

                          {/* Delete permanently button */}
                          <button
                            onClick={(e) => initiateSingleDelete(item, e)}
                            disabled={isOperating}
                            className="px-2.5 py-1.5 bg-[var(--danger)]/15 text-[var(--danger)] hover:bg-[var(--danger)]/25 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            title="Permanently erase"
                          >
                            <Trash2 size={13} />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Stats */}
        <div className="p-3 bg-[var(--surface-2)] border-t border-[var(--border)] text-xs text-[var(--text-muted)] flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            Showing <span className="font-mono text-[var(--text-primary)]">{filteredItems.length}</span> of{' '}
            <span className="font-mono text-[var(--text-primary)]">{deletedItems.length}</span> total discarded items
          </div>
          {selectedIds.size > 0 && (
            <div className="font-mono text-[var(--accent)]">
              {selectedIds.size} selected
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* PREVIEW MODAL */}
      {/* ======================================================== */}
      {previewItem && (
        <PreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onRestore={() => handleRestoreSingle(previewItem)}
          onDelete={() => initiateSingleDelete(previewItem)}
        />
      )}

      {/* ======================================================== */}
      {/* CONFIRM PERMANENT DELETE DIALOG */}
      {/* ======================================================== */}
      {deleteConfirmState.isOpen && (
        <ConfirmDeleteModal
          items={deleteConfirmState.itemsToDelete}
          isOperating={isOperating}
          onConfirm={executePermanentDelete}
          onCancel={() => setDeleteConfirmState({ isOpen: false, itemsToDelete: [] })}
        />
      )}
    </div>
  );
}

// =========================================================================
// PREVIEW MODAL COMPONENT
// =========================================================================
function PreviewModal({
  item,
  onClose,
  onRestore,
  onDelete,
}: {
  item: DeletedItem;
  onClose: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const moduleMeta = MODULE_CONFIG[item._type] || {
    label: item._type,
    icon: File,
    color: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  };
  const Icon = moduleMeta.icon;

  const isImage =
    item._type === 'project2Files' &&
    (item.type?.startsWith('image/') ||
      /\.(png|jpe?g|gif|webp|svg)$/i.test(item.name || item.url || ''));

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[var(--border)] bg-[var(--surface-2)] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 rounded-xl border ${moduleMeta.color}`}>
              <Icon size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono tracking-wider uppercase font-semibold text-[var(--text-muted)]">
                  {moduleMeta.label}
                </span>
                <span className="text-[var(--text-dim)]">•</span>
                <span className="text-[11px] text-[var(--danger)] font-mono">
                  Deleted {new Date(item.deletedAt).toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] truncate mt-0.5">
                {item._displayTitle}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-3)] rounded-lg transition-colors"
            title="Close preview (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body - Type-specific content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] text-xs font-mono">
            <div>
              <span className="text-[var(--text-muted)] block text-[10px] uppercase">Type</span>
              <span className="font-semibold text-[var(--text-primary)]">{moduleMeta.label}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-[10px] uppercase">Deleted On</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {new Date(item.deletedAt).toLocaleDateString()}
              </span>
            </div>
            {item.createdAt && (
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">Created On</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {item.status && (
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">Status</span>
                <span className="font-semibold text-[var(--accent)]">{item.status}</span>
              </div>
            )}
            {item.priority && (
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">Priority</span>
                <span className="font-semibold text-amber-400">{item.priority}</span>
              </div>
            )}
            {item.category && (
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">Category</span>
                <span className="font-semibold text-sky-400">{item.category}</span>
              </div>
            )}
            {item.progress !== undefined && (
              <div>
                <span className="text-[var(--text-muted)] block text-[10px] uppercase">Progress</span>
                <span className="font-semibold text-[var(--accent)]">{item.progress}%</span>
              </div>
            )}
          </div>

          {/* Type-Specific View */}
          {/* 1. NOTES */}
          {item._type === 'notes' && (
            <div className="space-y-4">
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((t: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 bg-[var(--surface-3)] text-xs rounded-md text-[var(--text-muted)]">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              <div className="p-5 bg-[var(--surface-2)]/60 rounded-xl border border-[var(--border)] min-h-[160px]">
                {item.content ? (
                  // Check if content looks like HTML
                  item.content.includes('<') && item.content.includes('>') ? (
                    <div
                      className="prose prose-invert max-w-none text-[var(--text-primary)] leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap font-mono text-[var(--text-primary)] leading-relaxed">
                      {item.content}
                    </div>
                  )
                ) : (
                  <p className="text-[var(--text-muted)] italic">Note is empty.</p>
                )}
              </div>
            </div>
          )}

          {/* 2. TASKS */}
          {item._type === 'tasks' && (
            <div className="space-y-4">
              {item.description && (
                <div>
                  <h4 className="text-xs uppercase font-mono text-[var(--text-muted)] mb-1">Description</h4>
                  <p className="text-[var(--text-primary)] bg-[var(--surface-2)] p-3 rounded-lg border border-[var(--border)]">
                    {item.description}
                  </p>
                </div>
              )}
              {item.notes && (
                <div>
                  <h4 className="text-xs uppercase font-mono text-[var(--text-muted)] mb-1">Task Notes</h4>
                  <div className="text-[var(--text-primary)] bg-[var(--surface-2)] p-3 rounded-lg border border-[var(--border)] whitespace-pre-wrap font-mono text-xs">
                    {item.notes}
                  </div>
                </div>
              )}
              {item.subtasks && item.subtasks.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase font-mono text-[var(--text-muted)] mb-2">Subtasks</h4>
                  <div className="space-y-1.5">
                    {item.subtasks.map((st: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-[var(--surface-2)] rounded border border-[var(--border)] text-xs">
                        <CheckSquare size={14} className={st.completed ? 'text-[var(--accent)]' : 'text-[var(--text-dim)]'} />
                        <span className={st.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}>
                          {st.title || st.text || `Subtask #${i + 1}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. PROJECTS / PROJECTS2 */}
          {(item._type === 'projects' || item._type === 'projects2') && (
            <div className="space-y-4">
              {item.description && (
                <div>
                  <h4 className="text-xs uppercase font-mono text-[var(--text-muted)] mb-1">Overview</h4>
                  <p className="text-[var(--text-primary)] bg-[var(--surface-2)] p-3.5 rounded-lg border border-[var(--border)]">
                    {item.description}
                  </p>
                </div>
              )}
              {item.detailedContent && (
                <div>
                  <h4 className="text-xs uppercase font-mono text-[var(--text-muted)] mb-1">Detailed Content</h4>
                  <div className="text-[var(--text-primary)] bg-[var(--surface-2)] p-3.5 rounded-lg border border-[var(--border)] whitespace-pre-wrap">
                    {item.detailedContent}
                  </div>
                </div>
              )}
              {item.notesContent && (
                <div>
                  <h4 className="text-xs uppercase font-mono text-[var(--text-muted)] mb-1">Project Notes</h4>
                  <div className="text-[var(--text-primary)] bg-[var(--surface-2)] p-3.5 rounded-lg border border-[var(--border)] whitespace-pre-wrap">
                    {item.notesContent}
                  </div>
                </div>
              )}
              {item.techStack && item.techStack.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase font-mono text-[var(--text-muted)] mb-1">Tech Stack</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {item.techStack.map((tech: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-[var(--surface-3)] text-xs rounded-md font-mono text-[var(--accent)]">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. FILES (project2Files) */}
          {item._type === 'project2Files' && (
            <div className="space-y-4">
              <div className="p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] flex flex-col items-center justify-center gap-3">
                {isImage ? (
                  <div className="max-h-72 w-full flex items-center justify-center overflow-hidden rounded-lg bg-black/40 border border-[var(--border)] p-2">
                    <img
                      src={item.url?.startsWith('http') ? item.url : `${BASE_URL}${item.url}`}
                      alt={item.name}
                      className="max-h-64 max-w-full object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center text-[var(--text-muted)]">
                    <File size={48} className="mx-auto mb-2 text-[var(--accent)]" />
                    <p className="font-semibold text-sm text-[var(--text-primary)]">{item.name}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {item.type || 'Binary file'} • {formatFileSize(item.size)}
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <a
                    href={item.url?.startsWith('http') ? item.url : `${BASE_URL}${item.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-[var(--surface-3)] hover:bg-[var(--border)] text-[var(--text-primary)] rounded-lg text-xs font-mono flex items-center gap-2 transition-colors"
                  >
                    <ExternalLink size={14} /> Open File in New Tab
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* 5. LINKS (project2Links) */}
          {item._type === 'project2Links' && (
            <div className="space-y-4">
              <div className="p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] space-y-3">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--accent)] hover:underline font-mono text-sm break-all flex items-center gap-2"
                >
                  <ExternalLink size={16} /> {item.url}
                </a>
                {item.description && <p className="text-sm text-[var(--text-primary)]">{item.description}</p>}
              </div>
            </div>
          )}

          {/* 6. IDEAS */}
          {item._type === 'ideas' && (
            <div className="space-y-4">
              {item.problem && (
                <div>
                  <h4 className="text-xs uppercase font-mono text-rose-400 mb-1">Problem Statement</h4>
                  <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-lg text-[var(--text-primary)]">
                    {item.problem}
                  </div>
                </div>
              )}
              {item.solution && (
                <div>
                  <h4 className="text-xs uppercase font-mono text-emerald-400 mb-1">Proposed Solution</h4>
                  <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-[var(--text-primary)]">
                    {item.solution}
                  </div>
                </div>
              )}
              {item.notes && (
                <div>
                  <h4 className="text-xs uppercase font-mono text-[var(--text-muted)] mb-1">Notes</h4>
                  <div className="p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-xs whitespace-pre-wrap">
                    {item.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. APPLICATIONS */}
          {item._type === 'applications' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-[var(--surface-2)] rounded-lg border border-[var(--border)] text-xs">
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px] uppercase">Company</span>
                  <span className="font-semibold text-base text-[var(--text-primary)]">{item.company}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block text-[10px] uppercase">Role</span>
                  <span className="font-semibold text-base text-[var(--accent)]">{item.role}</span>
                </div>
                {item.location && (
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] uppercase">Location</span>
                    <span className="font-semibold text-[var(--text-primary)]">{item.location}</span>
                  </div>
                )}
                {item.salary && (
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] uppercase">Salary</span>
                    <span className="font-semibold text-emerald-400">{item.salary}</span>
                  </div>
                )}
                {item.jobType && (
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] uppercase">Job Type</span>
                    <span className="font-semibold text-[var(--text-primary)]">{item.jobType}</span>
                  </div>
                )}
              </div>
              {item.requirements && (
                <div>
                  <h4 className="text-xs uppercase font-mono text-[var(--text-muted)] mb-1">Requirements</h4>
                  <p className="p-3 bg-[var(--surface-2)] rounded-lg border border-[var(--border)] text-xs whitespace-pre-wrap">
                    {item.requirements}
                  </p>
                </div>
              )}
              {item.notes && (
                <div>
                  <h4 className="text-xs uppercase font-mono text-[var(--text-muted)] mb-1">Notes</h4>
                  <p className="p-3 bg-[var(--surface-2)] rounded-lg border border-[var(--border)] text-xs whitespace-pre-wrap">
                    {item.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 8. LEARNING */}
          {item._type === 'learning' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[var(--surface-2)] rounded-lg border border-[var(--border)] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Type:</span>
                  <span className="font-semibold text-[var(--text-primary)]">{item.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Difficulty:</span>
                  <span className="font-semibold text-amber-400">{item.difficulty}</span>
                </div>
                {item.studyTime && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Study Time:</span>
                    <span className="font-semibold text-[var(--accent)]">{item.studyTime} mins</span>
                  </div>
                )}
              </div>
              {item.notes && (
                <div>
                  <h4 className="text-xs uppercase font-mono text-[var(--text-muted)] mb-1">Notes</h4>
                  <div className="p-3 bg-[var(--surface-2)] rounded-lg border border-[var(--border)] text-xs whitespace-pre-wrap">
                    {item.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 9. WORKSHEETS */}
          {item._type === 'worksheets' && (
            <div className="space-y-4">
              <div className="p-3 bg-[var(--surface-2)] rounded-lg border border-[var(--border)] text-xs font-mono">
                Worksheet with {Array.isArray(item.columns) ? item.columns.length : 0} columns and{' '}
                {Array.isArray(item.rows) ? item.rows.length : 0} rows.
              </div>
              {Array.isArray(item.columns) && item.columns.length > 0 && (
                <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-[var(--surface-3)]">
                      <tr>
                        {item.columns.map((c: any, i: number) => (
                          <th key={i} className="p-2 border-r border-[var(--border)] font-mono text-left">
                            {c.name || c.title || `Col ${i + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(item.rows) &&
                        item.rows.slice(0, 5).map((row: any, rIdx: number) => (
                          <tr key={rIdx} className="border-t border-[var(--border)]">
                            {item.columns.map((c: any, cIdx: number) => (
                              <td key={cIdx} className="p-2 border-r border-[var(--border)] text-[var(--text-muted)]">
                                {typeof row === 'object' ? String(row[c.id || cIdx] ?? '') : ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {Array.isArray(item.rows) && item.rows.length > 5 && (
                    <div className="p-2 text-center text-[10px] text-[var(--text-dim)] bg-[var(--surface-2)]">
                      + {item.rows.length - 5} more rows...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 10. GOALS */}
          {item._type === 'goals' && (
            <div className="space-y-4">
              {item.description && (
                <div>
                  <h4 className="text-xs uppercase font-mono text-[var(--text-muted)] mb-1">Description</h4>
                  <p className="p-3.5 bg-[var(--surface-2)] rounded-lg border border-[var(--border)]">
                    {item.description}
                  </p>
                </div>
              )}
              {item.targetDate && (
                <div className="text-xs font-mono text-[var(--text-muted)]">
                  Target Date:{' '}
                  <span className="text-[var(--text-primary)] font-semibold">
                    {new Date(item.targetDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 11. CALENDAR */}
          {item._type === 'calendar' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[var(--surface-2)] rounded-lg border border-[var(--border)] space-y-2 text-xs font-mono">
                <div>
                  <span className="text-[var(--text-muted)]">Start: </span>
                  <span className="text-[var(--text-primary)]">{item.start ? new Date(item.start).toLocaleString() : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">End: </span>
                  <span className="text-[var(--text-primary)]">{item.end ? new Date(item.end).toLocaleString() : 'N/A'}</span>
                </div>
              </div>
              {item.description && (
                <p className="p-3 bg-[var(--surface-2)] rounded-lg border border-[var(--border)] text-xs">
                  {item.description}
                </p>
              )}
            </div>
          )}

          {/* 12. WHITEBOARDS */}
          {(item._type === 'whiteboards' || item._type === 'whiteboards2') && (
            <div className="p-6 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] text-center text-xs text-[var(--text-muted)]">
              <Monitor size={40} className="mx-auto mb-2 text-violet-400" />
              <p className="font-semibold text-sm text-[var(--text-primary)]">Canvas Whiteboard Project</p>
              <p className="mt-1">Restoring will recover all saved drawings, diagrams, and shapes back to the workspace.</p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[var(--text-muted)] font-mono">
            ID: <span className="text-[var(--text-dim)]">{item.id}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onRestore}
              className="px-4 py-2 bg-[var(--accent)] hover:brightness-110 text-black font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <RotateCcw size={15} />
              <span>Restore Item</span>
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-[var(--danger)]/15 hover:bg-[var(--danger)]/25 text-[var(--danger)] font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 size={15} />
              <span>Permanently Delete</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[var(--surface-3)] hover:bg-[var(--border)] text-[var(--text-primary)] rounded-lg text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SAFE PERMANENT DELETION CONFIRMATION MODAL
// =========================================================================
function ConfirmDeleteModal({
  items,
  isOperating,
  onConfirm,
  onCancel,
}: {
  items: DeletedItem[];
  isOperating: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isMultiple = items.length > 1;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="bg-[var(--surface)] border-2 border-[var(--danger)]/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[var(--danger)]/10 text-[var(--danger)] rounded-xl flex-shrink-0">
            <AlertTriangle size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              {isMultiple
                ? `Permanently Delete ${items.length} Items?`
                : `Permanently Delete "${items[0]?._displayTitle}"?`}
            </h3>
            <p className="text-xs text-[var(--danger)] font-mono font-medium mt-1 uppercase tracking-wider">
              Warning: This action cannot be undone
            </p>
          </div>
        </div>

        <div className="p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl space-y-2 text-xs">
          <p className="text-[var(--text-primary)] leading-relaxed">
            {isMultiple ? (
              <>
                You are about to permanently purge <strong className="text-white font-mono">{items.length} items</strong> from the database. All associated contents, files, and history will be irreversibly erased.
              </>
            ) : (
              <>
                You are about to permanently erase <strong className="text-white">{items[0]?._displayTitle}</strong> from module <strong className="text-[var(--accent)] font-mono">{items[0]?._type}</strong>.
              </>
            )}
          </p>

          {isMultiple && (
            <div className="mt-3 pt-2 border-t border-[var(--border)] max-h-32 overflow-y-auto space-y-1">
              {items.slice(0, 6).map((it, idx) => (
                <div key={idx} className="text-[var(--text-muted)] font-mono truncate flex items-center gap-2">
                  <span className="text-[var(--danger)]">•</span>
                  <span>{it._displayTitle}</span>
                  <span className="text-[10px] text-[var(--text-dim)]">({it._type})</span>
                </div>
              ))}
              {items.length > 6 && (
                <div className="text-[10px] text-[var(--text-dim)] italic pl-3">
                  ...and {items.length - 6} more item(s)
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={isOperating}
            className="px-4 py-2 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isOperating}
            className="px-5 py-2 bg-[var(--danger)] hover:brightness-110 text-white font-semibold rounded-lg text-xs flex items-center gap-2 transition-all shadow-md shadow-red-950/50 disabled:opacity-50"
          >
            {isOperating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={15} />
                <span>Yes, Permanently Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}