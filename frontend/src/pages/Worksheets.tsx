import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useWorksheets } from '../stores';
import { 
  Plus, Trash2, Columns3, Copy, Pencil, Check, X, 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
  ChevronsUp, ChevronsDown,
  Baseline, Highlighter, PaintBucket, Bold, Italic, 
  Eraser, MoreVertical, Download, Search, Sparkles,
  ArrowUpDown, ExternalLink
} from 'lucide-react';

interface Column {
  id: string;
  name: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'URL' | 'CURRENCY';
  options?: string[];
}

interface CellStyle {
  color?: string;
  bg?: string;
  bold?: boolean;
  italic?: boolean;
}

interface Row {
  id: string;
  cells: Record<string, any>;
  styles?: Record<string, CellStyle>;
  highlight?: string;
}

const TEXT_COLORS = [
  { name: 'Default', value: '', preview: 'var(--text-primary)' },
  { name: 'Red', value: '#ef4444', preview: '#ef4444' },
  { name: 'Orange', value: '#f97316', preview: '#f97316' },
  { name: 'Amber', value: '#f59e0b', preview: '#f59e0b' },
  { name: 'Emerald', value: '#10b981', preview: '#10b981' },
  { name: 'Cyan', value: '#06b6d4', preview: '#06b6d4' },
  { name: 'Sky Blue', value: '#38bdf8', preview: '#38bdf8' },
  { name: 'Purple', value: '#a855f7', preview: '#a855f7' },
  { name: 'Pink', value: '#ec4899', preview: '#ec4899' },
  { name: 'Pure White', value: '#ffffff', preview: '#ffffff' },
  { name: 'Dim Gray', value: '#94a3b8', preview: '#94a3b8' },
];

const HIGHLIGHT_COLORS = [
  { name: 'None', value: '', preview: 'transparent' },
  { name: 'Red', value: 'rgba(239, 68, 68, 0.25)', preview: '#ef4444' },
  { name: 'Orange', value: 'rgba(249, 115, 22, 0.25)', preview: '#f97316' },
  { name: 'Yellow', value: 'rgba(245, 158, 11, 0.25)', preview: '#f59e0b' },
  { name: 'Green', value: 'rgba(16, 185, 129, 0.25)', preview: '#10b981' },
  { name: 'Cyan', value: 'rgba(6, 182, 212, 0.25)', preview: '#06b6d4' },
  { name: 'Blue', value: 'rgba(56, 189, 248, 0.25)', preview: '#38bdf8' },
  { name: 'Purple', value: 'rgba(168, 85, 247, 0.25)', preview: '#a855f7' },
  { name: 'Pink', value: 'rgba(236, 72, 153, 0.25)', preview: '#ec4899' },
  { name: 'Glass Slate', value: 'rgba(255, 255, 255, 0.08)', preview: '#64748b' },
];

export function Worksheets() {
  const { items, fetch, update, add, remove, loading } = useWorksheets();
  const [activeSheet, setActiveSheet] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCell, setSelectedCell] = useState<{ rowId: string; colId: string } | null>(null);

  // Column editing state
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColName, setEditingColName] = useState<string>('');
  const [activeColMenu, setActiveColMenu] = useState<string | null>(null);

  // Row menu state
  const [activeRowMenu, setActiveRowMenu] = useState<string | null>(null);

  // Color picker popover states
  const [activeColorPicker, setActiveColorPicker] = useState<'text' | 'bg' | 'rowBg' | null>(null);

  // New Column Modal state
  const [isAddColModalOpen, setIsAddColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<Column['type']>('TEXT');
  const [newColOptions, setNewColOptions] = useState('');

  // Debounced auto-save ref
  const saveTimeoutRef = useRef<any>(null);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      if (!activeSheet) {
        setActiveSheet(items[0]);
      } else {
        const found = items.find((s: any) => s.id === activeSheet.id);
        if (!found) {
          setActiveSheet(items[0]);
        }
      }
    } else if (!loading) {
      setActiveSheet(null);
    }
  }, [items]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.worksheet-popover') && !target.closest('.worksheet-menu-trigger')) {
        setActiveColMenu(null);
        setActiveRowMenu(null);
        setActiveColorPicker(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Helper to update active sheet locally & persist
  const updateCurrentSheet = (updater: (prev: any) => any, immediate = false) => {
    setActiveSheet((prev: any) => {
      if (!prev) return prev;
      const next = updater(prev);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (immediate) {
        update(next.id, {
          name: next.name,
          columns: next.columns,
          rows: next.rows,
        });
      } else {
        saveTimeoutRef.current = setTimeout(() => {
          update(next.id, {
            name: next.name,
            columns: next.columns,
            rows: next.rows,
          });
        }, 500);
      }
      return next;
    });
  };

  /* -------------------------------------------------------------------------- */
  /*                              CELL MANAGEMENT                               */
  /* -------------------------------------------------------------------------- */

  const handleCellChange = (rowId: string, colId: string, value: any) => {
    updateCurrentSheet((sheet: any) => {
      const newRows = (sheet.rows || []).map((r: any) => 
        r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: value } } : r
      );
      return { ...sheet, rows: newRows };
    }, false);
  };

  const applyCellStyle = (rowId: string, colId: string, styleUpdate: Partial<CellStyle>) => {
    updateCurrentSheet((sheet: any) => {
      const newRows = (sheet.rows || []).map((r: any) => {
        if (r.id !== rowId) return r;
        const currentStyles = r.styles || {};
        const currentCell = currentStyles[colId] || {};
        const newCell = { ...currentCell, ...styleUpdate };
        return {
          ...r,
          styles: {
            ...currentStyles,
            [colId]: newCell,
          },
        };
      });
      return { ...sheet, rows: newRows };
    }, true);
  };

  const applyRowHighlight = (rowId: string, highlightColor: string) => {
    updateCurrentSheet((sheet: any) => {
      const newRows = (sheet.rows || []).map((r: any) => 
        r.id === rowId ? { ...r, highlight: highlightColor } : r
      );
      return { ...sheet, rows: newRows };
    }, true);
  };

  const clearCellFormatting = (rowId: string, colId: string) => {
    updateCurrentSheet((sheet: any) => {
      const newRows = (sheet.rows || []).map((r: any) => {
        if (r.id !== rowId) return r;
        const currentStyles = { ...(r.styles || {}) };
        delete currentStyles[colId];
        return { ...r, styles: currentStyles };
      });
      return { ...sheet, rows: newRows };
    }, true);
  };

  const clearRowFormatting = (rowId: string) => {
    updateCurrentSheet((sheet: any) => {
      const newRows = (sheet.rows || []).map((r: any) => 
        r.id === rowId ? { ...r, highlight: undefined, styles: {} } : r
      );
      return { ...sheet, rows: newRows };
    }, true);
  };

  /* -------------------------------------------------------------------------- */
  /*                               ROW MANAGEMENT                               */
  /* -------------------------------------------------------------------------- */

  const addRow = () => {
    if (!activeSheet) return;
    const newRowId = crypto.randomUUID();
    updateCurrentSheet((sheet: any) => {
      const newRows = [...(sheet.rows || []), { id: newRowId, cells: {}, styles: {} }];
      return { ...sheet, rows: newRows };
    }, true);
    if (activeSheet.columns && activeSheet.columns.length > 0) {
      setSelectedCell({ rowId: newRowId, colId: activeSheet.columns[0].id });
    }
  };

  const insertRowAt = (index: number) => {
    if (!activeSheet) return;
    const newRowId = crypto.randomUUID();
    updateCurrentSheet((sheet: any) => {
      const newRows = [...(sheet.rows || [])];
      newRows.splice(index, 0, { id: newRowId, cells: {}, styles: {} });
      return { ...sheet, rows: newRows };
    }, true);
    if (activeSheet.columns && activeSheet.columns.length > 0) {
      setSelectedCell({ rowId: newRowId, colId: activeSheet.columns[0].id });
    }
  };

  const moveRow = (index: number, direction: 'up' | 'down') => {
    if (!activeSheet || !activeSheet.rows) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeSheet.rows.length) return;

    updateCurrentSheet((sheet: any) => {
      const newRows = [...sheet.rows];
      const [moved] = newRows.splice(index, 1);
      newRows.splice(targetIndex, 0, moved);
      return { ...sheet, rows: newRows };
    }, true);
  };

  const moveRowToExtreme = (index: number, position: 'top' | 'bottom') => {
    if (!activeSheet || !activeSheet.rows) return;
    const targetIndex = position === 'top' ? 0 : activeSheet.rows.length - 1;
    if (targetIndex === index) return;

    updateCurrentSheet((sheet: any) => {
      const newRows = [...sheet.rows];
      const [moved] = newRows.splice(index, 1);
      if (position === 'top') {
        newRows.unshift(moved);
      } else {
        newRows.push(moved);
      }
      return { ...sheet, rows: newRows };
    }, true);
  };

  const duplicateRow = (rowId: string) => {
    if (!activeSheet || !activeSheet.rows) return;
    const rowIndex = activeSheet.rows.findIndex((r: any) => r.id === rowId);
    if (rowIndex === -1) return;
    const sourceRow = activeSheet.rows[rowIndex];
    const newRow = {
      id: crypto.randomUUID(),
      cells: { ...(sourceRow.cells || {}) },
      styles: JSON.parse(JSON.stringify(sourceRow.styles || {})),
      highlight: sourceRow.highlight,
    };
    updateCurrentSheet((sheet: any) => {
      const newRows = [...sheet.rows];
      newRows.splice(rowIndex + 1, 0, newRow);
      return { ...sheet, rows: newRows };
    }, true);
  };

  const deleteRow = (rowId: string) => {
    if (!activeSheet || !window.confirm('Delete row?')) return;
    updateCurrentSheet((sheet: any) => {
      const newRows = sheet.rows.filter((r: any) => r.id !== rowId);
      return { ...sheet, rows: newRows };
    }, true);
    if (selectedCell?.rowId === rowId) {
      setSelectedCell(null);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                             COLUMN MANAGEMENT                              */
  /* -------------------------------------------------------------------------- */

  const handleOpenAddColModal = () => {
    setNewColName(`Column ${(activeSheet?.columns?.length || 0) + 1}`);
    setNewColType('TEXT');
    setNewColOptions('');
    setIsAddColModalOpen(true);
  };

  const handleCreateColumn = () => {
    if (!activeSheet) return;
    const trimmed = newColName.trim() || `Column ${(activeSheet.columns?.length || 0) + 1}`;
    const newColId = crypto.randomUUID();
    const options = newColType === 'SELECT' 
      ? newColOptions.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    const newCol: Column = {
      id: newColId,
      name: trimmed,
      type: newColType,
      options,
    };

    updateCurrentSheet((sheet: any) => {
      const newCols = [...(sheet.columns || []), newCol];
      return { ...sheet, columns: newCols };
    }, true);

    setIsAddColModalOpen(false);
  };

  const renameColumn = (colId: string, newName: string) => {
    if (!activeSheet) return;
    const trimmed = newName.trim();
    if (!trimmed) return;
    updateCurrentSheet((sheet: any) => {
      const newCols = (sheet.columns || []).map((c: any) => 
        c.id === colId ? { ...c, name: trimmed } : c
      );
      return { ...sheet, columns: newCols };
    }, true);
  };

  const changeColumnType = (colId: string, newType: Column['type']) => {
    if (!activeSheet) return;
    updateCurrentSheet((sheet: any) => {
      const newCols = (sheet.columns || []).map((c: any) => {
        if (c.id !== colId) return c;
        let options = c.options;
        if (newType === 'SELECT' && (!options || options.length === 0)) {
          options = ['Option 1', 'Option 2', 'Option 3'];
        }
        return { ...c, type: newType, options };
      });
      return { ...sheet, columns: newCols };
    }, true);
  };

  const moveColumn = (index: number, direction: 'left' | 'right') => {
    if (!activeSheet || !activeSheet.columns) return;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeSheet.columns.length) return;

    updateCurrentSheet((sheet: any) => {
      const newCols = [...sheet.columns];
      const [moved] = newCols.splice(index, 1);
      newCols.splice(targetIndex, 0, moved);
      return { ...sheet, columns: newCols };
    }, true);
  };

  const moveColumnToExtreme = (index: number, position: 'start' | 'end') => {
    if (!activeSheet || !activeSheet.columns) return;
    const targetIndex = position === 'start' ? 0 : activeSheet.columns.length - 1;
    if (targetIndex === index) return;

    updateCurrentSheet((sheet: any) => {
      const newCols = [...sheet.columns];
      const [moved] = newCols.splice(index, 1);
      if (position === 'start') {
        newCols.unshift(moved);
      } else {
        newCols.push(moved);
      }
      return { ...sheet, columns: newCols };
    }, true);
  };

  const deleteColumn = (colId: string) => {
    if (!activeSheet || !window.confirm('Delete column?')) return;
    updateCurrentSheet((sheet: any) => {
      const newCols = sheet.columns.filter((c: any) => c.id !== colId);
      const newRows = (sheet.rows || []).map((r: any) => {
        const { [colId]: removed, ...rest } = r.cells;
        const styles = { ...(r.styles || {}) };
        delete styles[colId];
        return { ...r, cells: rest, styles };
      });
      return { ...sheet, columns: newCols, rows: newRows };
    }, true);
    if (selectedCell?.colId === colId) {
      setSelectedCell(null);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                            SHEET MANAGEMENT                                */
  /* -------------------------------------------------------------------------- */

  const createSheet = () => {
    add({
      name: 'New Worksheet',
      columns: [
        { id: crypto.randomUUID(), name: 'Item', type: 'TEXT' },
        { id: crypto.randomUUID(), name: 'Category', type: 'TEXT' },
        { id: crypto.randomUUID(), name: 'Status', type: 'SELECT', options: ['Pending', 'In Progress', 'Completed', 'On Hold'] },
        { id: crypto.randomUUID(), name: 'Priority', type: 'SELECT', options: ['Low', 'Medium', 'High', 'Urgent'] },
        { id: crypto.randomUUID(), name: 'Due Date', type: 'DATE' },
      ],
      rows: [
        { id: crypto.randomUUID(), cells: { Item: 'Review quarterly goals', Category: 'Planning', Status: 'In Progress', Priority: 'High' } },
        { id: crypto.randomUUID(), cells: { Item: 'Fix header layout bug', Category: 'Engineering', Status: 'Completed', Priority: 'Urgent' } },
      ]
    });
  };

  const duplicateSheet = (sheet: any) => {
    add({
      name: `${sheet.name} (Copy)`,
      columns: JSON.parse(JSON.stringify(sheet.columns || [])),
      rows: JSON.parse(JSON.stringify(sheet.rows || [])),
    });
  };

  const exportToCSV = () => {
    if (!activeSheet || !activeSheet.columns || !activeSheet.rows) return;
    const headers = activeSheet.columns.map((c: any) => `"${c.name.replace(/"/g, '""')}"`).join(',');
    const rows = activeSheet.rows.map((r: any) => {
      return activeSheet.columns.map((c: any) => {
        const val = r.cells[c.id] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    });
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeSheet.name.replace(/[^a-z0-9_-]/gi, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Active cell styling details
  const activeSelectedRow = useMemo(() => {
    if (!selectedCell || !activeSheet) return null;
    return (activeSheet.rows || []).find((r: any) => r.id === selectedCell.rowId);
  }, [selectedCell, activeSheet]);

  const activeSelectedCol = useMemo(() => {
    if (!selectedCell || !activeSheet) return null;
    return (activeSheet.columns || []).find((c: any) => c.id === selectedCell.colId);
  }, [selectedCell, activeSheet]);

  const activeCellStyle = useMemo(() => {
    if (!activeSelectedRow || !selectedCell) return null;
    return activeSelectedRow.styles?.[selectedCell.colId] || null;
  }, [activeSelectedRow, selectedCell]);

  // Filtered rows for in-sheet search
  const filteredRows = useMemo(() => {
    if (!activeSheet || !activeSheet.rows) return [];
    if (!searchQuery.trim()) return activeSheet.rows;
    const query = searchQuery.toLowerCase();
    return activeSheet.rows.filter((row: any) => {
      return Object.values(row.cells || {}).some(val => 
        String(val ?? '').toLowerCase().includes(query)
      );
    });
  }, [activeSheet, searchQuery]);

  if (loading && !activeSheet) {
    return <div className="p-8 text-[var(--text-muted)] animate-pulse">Loading worksheets...</div>;
  }

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold font-mono text-[var(--accent)] tracking-wide">Worksheets</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-3)] text-[var(--text-muted)] border border-[var(--border)] font-mono">
            {items.length} {items.length === 1 ? 'Sheet' : 'Sheets'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {activeSheet && (
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-white rounded text-sm hover:border-[var(--accent)] transition-colors"
              title="Export as CSV"
            >
              <Download size={14} /> Export CSV
            </button>
          )}
          <button 
            onClick={createSheet} 
            className="flex items-center gap-2 bg-[var(--accent)] text-black px-4 py-2 rounded font-bold hover:brightness-110 shadow-lg shadow-[var(--accent)]/10 transition-all"
          >
            <Plus size={16} /> New Worksheet
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Sidebar List */}
        <div className="w-64 flex flex-col gap-2 border-r border-[var(--border)] pr-3 flex-shrink-0 overflow-y-auto">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-dim)] px-1 py-1">
            All Worksheets
          </div>
          {items.map((sheet: any) => {
            const isActive = activeSheet?.id === sheet.id;
            const rowCount = sheet.rows?.length || 0;
            const colCount = sheet.columns?.length || 0;

            return (
              <div 
                key={sheet.id}
                onClick={() => {
                  setActiveSheet(sheet);
                  setSelectedCell(null);
                }}
                className={`p-2.5 rounded-lg border cursor-pointer flex justify-between items-center group transition-all ${
                  isActive 
                    ? 'bg-[var(--surface-3)] border-[var(--accent)] shadow-sm' 
                    : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--text-muted)]'
                }`}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className={`font-semibold text-sm truncate ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                    {sheet.name || 'Untitled Sheet'}
                  </div>
                  <div className="text-[10px] text-[var(--text-dim)] font-mono mt-0.5">
                    {rowCount} {rowCount === 1 ? 'row' : 'rows'} · {colCount} {colCount === 1 ? 'col' : 'cols'}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateSheet(sheet);
                    }}
                    className="p-1 text-[var(--text-dim)] hover:text-[var(--accent)] rounded hover:bg-[var(--surface-2)]"
                    title="Duplicate Sheet"
                  >
                    <Copy size={13} />
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (window.confirm(`Delete worksheet "${sheet.name}"?`)) remove(sheet.id); 
                    }} 
                    className="p-1 text-[var(--text-dim)] hover:text-[var(--danger)] rounded hover:bg-[var(--surface-2)]"
                    title="Delete Sheet"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="p-4 text-center text-xs text-[var(--text-dim)] border border-dashed border-[var(--border)] rounded">
              No worksheets yet. Click "New Worksheet" to create one.
            </div>
          )}
        </div>

        {/* Right Detail View / Spreadsheet */}
        {activeSheet ? (
          <div className="flex-1 flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden shadow-xl">
            {/* Sheet Title and Primary Actions Bar */}
            <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-2)] flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                <input 
                  value={activeSheet.name} 
                  onChange={(e) => {
                    const newName = e.target.value;
                    updateCurrentSheet((sheet: any) => ({ ...sheet, name: newName }), false);
                  }}
                  onBlur={() => {
                    update(activeSheet.id, { name: activeSheet.name });
                  }}
                  className="bg-transparent text-lg font-bold outline-none text-[var(--text-primary)] focus:border-b-2 border-[var(--accent)] transition-all px-1 py-0.5 rounded w-full max-w-sm"
                  placeholder="Sheet Name"
                />
              </div>

              {/* In-Sheet Search */}
              <div className="relative flex items-center min-w-[180px]">
                <Search size={14} className="absolute left-2.5 text-[var(--text-dim)]" />
                <input
                  type="text"
                  placeholder="Filter rows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--surface-3)] border border-[var(--border)] rounded pl-8 pr-3 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-dim)]"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 text-[var(--text-dim)] hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleOpenAddColModal} 
                  className="px-3 py-1.5 bg-[var(--surface-3)] border border-[var(--border)] hover:border-[var(--accent)] rounded text-xs font-semibold flex items-center gap-1.5 hover:bg-[var(--surface-4)] text-[var(--text-primary)] transition-all shadow-sm"
                >
                  <Columns3 size={14} className="text-[var(--accent)]" /> Add Column
                </button>
                <button 
                  onClick={addRow} 
                  className="px-3 py-1.5 bg-[var(--surface-3)] border border-[var(--border)] hover:border-[var(--accent)] rounded text-xs font-semibold flex items-center gap-1.5 hover:bg-[var(--surface-4)] text-[var(--text-primary)] transition-all shadow-sm"
                >
                  <Plus size={14} className="text-[var(--accent)]" /> Add Row
                </button>
              </div>
            </div>

            {/* Formatting Toolbar */}
            <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--surface)] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Active Selection Indicator */}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] font-mono text-[11px]">
                  {selectedCell ? (
                    <>
                      <span className="text-[var(--accent)] font-bold">
                        Row {(activeSheet.rows || []).findIndex((r: any) => r.id === selectedCell.rowId) + 1}
                      </span>
                      <span>:</span>
                      <span className="text-[var(--text-primary)] truncate max-w-[120px]">
                        {activeSelectedCol?.name || 'Cell'}
                      </span>
                    </>
                  ) : (
                    <span className="text-[var(--text-dim)] italic">Select a cell to format</span>
                  )}
                </div>

                <div className="h-4 w-[1px] bg-[var(--border)] mx-1" />

                {/* Text Color Dropdown */}
                <div className="relative worksheet-popover">
                  <button
                    onClick={() => setActiveColorPicker(activeColorPicker === 'text' ? null : 'text')}
                    disabled={!selectedCell}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-colors worksheet-menu-trigger ${
                      activeColorPicker === 'text'
                        ? 'bg-[var(--surface-3)] border-[var(--accent)] text-white'
                        : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)] hover:text-white disabled:opacity-40 disabled:pointer-events-none'
                    }`}
                    title="Text Color"
                  >
                    <Baseline size={14} style={{ color: activeCellStyle?.color || 'currentColor' }} />
                    <span className="text-[11px] font-medium">Text Color</span>
                    <div 
                      className="w-3 h-3 rounded-full border border-[var(--border-strong)]" 
                      style={{ backgroundColor: activeCellStyle?.color || 'var(--text-primary)' }} 
                    />
                  </button>

                  {activeColorPicker === 'text' && selectedCell && (
                    <div 
                      onWheel={(e) => e.stopPropagation()}
                      className="absolute left-0 top-full mt-1 p-2 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-lg shadow-2xl z-50 w-56 flex flex-col gap-2 backdrop-blur-md max-h-[min(320px,calc(100vh-220px))] overflow-y-auto overscroll-contain"
                    >
                      <div className="text-[10px] font-mono uppercase text-[var(--text-dim)] font-bold">Text Colors</div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {TEXT_COLORS.map(c => (
                          <button
                            key={c.name}
                            onClick={() => {
                              applyCellStyle(selectedCell.rowId, selectedCell.colId, { color: c.value });
                              setActiveColorPicker(null);
                            }}
                            className={`w-8 h-8 rounded flex items-center justify-center border transition-transform hover:scale-110 ${
                              (activeCellStyle?.color || '') === c.value ? 'border-white scale-105' : 'border-[var(--border)]'
                            }`}
                            style={{ backgroundColor: c.preview || 'var(--surface-3)' }}
                            title={c.name}
                          >
                            {!c.value && <X size={12} className="text-[var(--danger)]" />}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
                        <label className="text-[10px] text-[var(--text-muted)] cursor-pointer flex items-center gap-1.5 hover:text-white">
                          <span>Custom:</span>
                          <input
                            type="color"
                            value={activeCellStyle?.color || '#ffffff'}
                            onChange={(e) => applyCellStyle(selectedCell.rowId, selectedCell.colId, { color: e.target.value })}
                            className="w-5 h-5 bg-transparent border-0 rounded cursor-pointer p-0"
                          />
                        </label>
                        <button
                          onClick={() => {
                            applyCellStyle(selectedCell.rowId, selectedCell.colId, { color: '' });
                            setActiveColorPicker(null);
                          }}
                          className="text-[10px] text-[var(--danger)] hover:underline"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Highlight / Fill Color Dropdown */}
                <div className="relative worksheet-popover">
                  <button
                    onClick={() => setActiveColorPicker(activeColorPicker === 'bg' ? null : 'bg')}
                    disabled={!selectedCell}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-colors worksheet-menu-trigger ${
                      activeColorPicker === 'bg'
                        ? 'bg-[var(--surface-3)] border-[var(--accent)] text-white'
                        : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)] hover:text-white disabled:opacity-40 disabled:pointer-events-none'
                    }`}
                    title="Highlight Cell"
                  >
                    <Highlighter size={14} className="text-[var(--warning)]" />
                    <span className="text-[11px] font-medium">Highlight</span>
                    <div 
                      className="w-3 h-3 rounded border border-[var(--border-strong)]" 
                      style={{ backgroundColor: activeCellStyle?.bg || 'transparent' }} 
                    />
                  </button>

                  {activeColorPicker === 'bg' && selectedCell && (
                    <div 
                      onWheel={(e) => e.stopPropagation()}
                      className="absolute left-0 top-full mt-1 p-2 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-lg shadow-2xl z-50 w-56 flex flex-col gap-2 backdrop-blur-md max-h-[min(320px,calc(100vh-220px))] overflow-y-auto overscroll-contain"
                    >
                      <div className="text-[10px] font-mono uppercase text-[var(--text-dim)] font-bold">Cell Highlights</div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {HIGHLIGHT_COLORS.map(c => (
                          <button
                            key={c.name}
                            onClick={() => {
                              applyCellStyle(selectedCell.rowId, selectedCell.colId, { bg: c.value });
                              setActiveColorPicker(null);
                            }}
                            className={`w-8 h-8 rounded flex items-center justify-center border transition-transform hover:scale-110 ${
                              (activeCellStyle?.bg || '') === c.value ? 'border-white scale-105' : 'border-[var(--border)]'
                            }`}
                            style={{ backgroundColor: c.value || 'var(--surface-3)' }}
                            title={c.name}
                          >
                            {!c.value && <X size={12} className="text-[var(--text-dim)]" />}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
                        <label className="text-[10px] text-[var(--text-muted)] cursor-pointer flex items-center gap-1.5 hover:text-white">
                          <span>Custom:</span>
                          <input
                            type="color"
                            value={activeCellStyle?.bg || '#3b82f6'}
                            onChange={(e) => applyCellStyle(selectedCell.rowId, selectedCell.colId, { bg: e.target.value })}
                            className="w-5 h-5 bg-transparent border-0 rounded cursor-pointer p-0"
                          />
                        </label>
                        <button
                          onClick={() => {
                            applyCellStyle(selectedCell.rowId, selectedCell.colId, { bg: '' });
                            setActiveColorPicker(null);
                          }}
                          className="text-[10px] text-[var(--danger)] hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bold Toggle */}
                <button
                  onClick={() => {
                    if (!selectedCell) return;
                    applyCellStyle(selectedCell.rowId, selectedCell.colId, { bold: !activeCellStyle?.bold });
                  }}
                  disabled={!selectedCell}
                  className={`p-1.5 rounded border transition-colors ${
                    activeCellStyle?.bold
                      ? 'bg-[var(--accent)] text-black border-[var(--accent)] font-bold'
                      : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)] hover:text-white disabled:opacity-40 disabled:pointer-events-none'
                  }`}
                  title="Toggle Bold"
                >
                  <Bold size={13} />
                </button>

                {/* Italic Toggle */}
                <button
                  onClick={() => {
                    if (!selectedCell) return;
                    applyCellStyle(selectedCell.rowId, selectedCell.colId, { italic: !activeCellStyle?.italic });
                  }}
                  disabled={!selectedCell}
                  className={`p-1.5 rounded border transition-colors ${
                    activeCellStyle?.italic
                      ? 'bg-[var(--accent)] text-black border-[var(--accent)] italic'
                      : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)] hover:text-white disabled:opacity-40 disabled:pointer-events-none'
                  }`}
                  title="Toggle Italic"
                >
                  <Italic size={13} />
                </button>

                <div className="h-4 w-[1px] bg-[var(--border)] mx-1" />

                {/* Highlight Entire Row */}
                <div className="relative worksheet-popover">
                  <button
                    onClick={() => setActiveColorPicker(activeColorPicker === 'rowBg' ? null : 'rowBg')}
                    disabled={!selectedCell}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-colors worksheet-menu-trigger ${
                      activeColorPicker === 'rowBg'
                        ? 'bg-[var(--surface-3)] border-[var(--accent)] text-white'
                        : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)] hover:text-white disabled:opacity-40 disabled:pointer-events-none'
                    }`}
                    title="Highlight Entire Row"
                  >
                    <PaintBucket size={14} className="text-[var(--purple)]" />
                    <span className="text-[11px] font-medium">Row Highlight</span>
                    <div 
                      className="w-3 h-3 rounded border border-[var(--border-strong)]" 
                      style={{ backgroundColor: activeSelectedRow?.highlight || 'transparent' }} 
                    />
                  </button>

                  {activeColorPicker === 'rowBg' && selectedCell && (
                    <div 
                      onWheel={(e) => e.stopPropagation()}
                      className="absolute left-0 top-full mt-1 p-2 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-lg shadow-2xl z-50 w-56 flex flex-col gap-2 backdrop-blur-md max-h-[min(320px,calc(100vh-220px))] overflow-y-auto overscroll-contain"
                    >
                      <div className="text-[10px] font-mono uppercase text-[var(--text-dim)] font-bold">Row Highlights</div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {HIGHLIGHT_COLORS.map(c => (
                          <button
                            key={c.name}
                            onClick={() => {
                              applyRowHighlight(selectedCell.rowId, c.value);
                              setActiveColorPicker(null);
                            }}
                            className={`w-8 h-8 rounded flex items-center justify-center border transition-transform hover:scale-110 ${
                              (activeSelectedRow?.highlight || '') === c.value ? 'border-white scale-105' : 'border-[var(--border)]'
                            }`}
                            style={{ backgroundColor: c.value || 'var(--surface-3)' }}
                            title={c.name}
                          >
                            {!c.value && <X size={12} className="text-[var(--text-dim)]" />}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
                        <button
                          onClick={() => {
                            applyRowHighlight(selectedCell.rowId, '');
                            setActiveColorPicker(null);
                          }}
                          className="text-[10px] text-[var(--danger)] hover:underline"
                        >
                          Clear Row Highlight
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Clear Cell Formatting */}
                <button
                  onClick={() => {
                    if (!selectedCell) return;
                    clearCellFormatting(selectedCell.rowId, selectedCell.colId);
                  }}
                  disabled={!selectedCell}
                  className="p-1.5 rounded border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--danger)] hover:border-[var(--danger)]/50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  title="Clear Cell Formatting"
                >
                  <Eraser size={13} />
                </button>
              </div>

              {/* Quick tip badge */}
              <div className="text-[11px] text-[var(--text-dim)] font-mono hidden md:flex items-center gap-1.5">
                <Sparkles size={12} className="text-[var(--accent)]" />
                <span>Tip: Double-click header to rename · Use arrows to reorder</span>
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                <thead className="bg-[var(--surface-3)] sticky top-0 z-10 select-none shadow-sm">
                  <tr>
                    {/* Row Index & Reorder Controls Header */}
                    <th className="border border-[var(--border)] w-20 text-center text-[var(--text-dim)] font-mono text-xs uppercase p-2">
                      <div className="flex items-center justify-center gap-1">
                        <ArrowUpDown size={12} className="text-[var(--text-dim)]" />
                        <span>#</span>
                      </div>
                    </th>

                    {/* Column Headers */}
                    {(activeSheet.columns || []).map((col: Column, cIndex: number) => {
                      const isFirstCol = cIndex === 0;
                      const isLastCol = cIndex === (activeSheet.columns.length - 1);
                      const isEditing = editingColId === col.id;

                      return (
                        <th 
                          key={col.id} 
                          className="border border-[var(--border)] p-2 font-mono text-xs uppercase tracking-wider text-[var(--text-primary)] group/colhead relative min-w-[160px] bg-[var(--surface-3)]"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            {/* Column Name / Inline Edit */}
                            <div className="flex-1 min-w-0 pr-1">
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    autoFocus
                                    value={editingColName}
                                    onChange={(e) => setEditingColName(e.target.value)}
                                    onBlur={() => {
                                      if (editingColName.trim()) renameColumn(col.id, editingColName);
                                      setEditingColId(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        if (editingColName.trim()) renameColumn(col.id, editingColName);
                                        setEditingColId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingColId(null);
                                      }
                                    }}
                                    className="bg-[var(--surface)] text-[var(--accent)] font-bold text-xs uppercase px-1.5 py-0.5 rounded border border-[var(--accent)] outline-none w-full"
                                  />
                                  <button
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      if (editingColName.trim()) renameColumn(col.id, editingColName);
                                      setEditingColId(null);
                                    }}
                                    className="p-1 text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded"
                                    title="Save name"
                                  >
                                    <Check size={12} />
                                  </button>
                                </div>
                              ) : (
                                <div 
                                  onDoubleClick={() => {
                                    setEditingColId(col.id);
                                    setEditingColName(col.name);
                                  }}
                                  className="flex items-center gap-1.5 cursor-pointer py-0.5 group/rename"
                                  title="Double-click or click pencil to rename"
                                >
                                  <span className="font-semibold text-xs truncate text-[var(--text-primary)]">
                                    {col.name}
                                  </span>
                                  <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[var(--surface-2)] text-[var(--text-dim)] border border-[var(--border)]">
                                    {col.type}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingColId(col.id);
                                      setEditingColName(col.name);
                                    }}
                                    className="opacity-0 group-hover/colhead:opacity-100 p-0.5 text-[var(--text-dim)] hover:text-[var(--accent)] transition-opacity"
                                    title="Rename column"
                                  >
                                    <Pencil size={11} />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Column Reordering & Menu Actions */}
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              {/* Move Left */}
                              <button
                                onClick={() => moveColumn(cIndex, 'left')}
                                disabled={isFirstCol}
                                title={isFirstCol ? 'First column' : 'Move column left'}
                                className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)] disabled:opacity-20 disabled:pointer-events-none transition-colors"
                              >
                                <ChevronLeft size={13} />
                              </button>

                              {/* Move Right */}
                              <button
                                onClick={() => moveColumn(cIndex, 'right')}
                                disabled={isLastCol}
                                title={isLastCol ? 'Last column' : 'Move column right'}
                                className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)] disabled:opacity-20 disabled:pointer-events-none transition-colors"
                              >
                                <ChevronRight size={13} />
                              </button>

                              {/* Column Dropdown Menu */}
                              <div className="relative worksheet-popover">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveColMenu(activeColMenu === col.id ? null : col.id);
                                  }}
                                  className="p-1 rounded text-[var(--text-dim)] hover:text-white hover:bg-[var(--surface-2)] transition-colors worksheet-menu-trigger"
                                  title="Column options"
                                >
                                  <MoreVertical size={13} />
                                </button>

                                {activeColMenu === col.id && (
                                  <div 
                                    onWheel={(e) => e.stopPropagation()}
                                    className="absolute right-0 top-full mt-1 w-52 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-lg shadow-2xl p-1 z-50 text-xs flex flex-col gap-0.5 backdrop-blur-md max-h-[min(340px,calc(100vh-220px))] overflow-y-auto overscroll-contain"
                                  >
                                    <button
                                      onClick={() => {
                                        setEditingColId(col.id);
                                        setEditingColName(col.name);
                                        setActiveColMenu(null);
                                      }}
                                      className="flex items-center gap-2 px-2 py-1.5 text-left rounded hover:bg-[var(--surface-3)] text-[var(--text-primary)]"
                                    >
                                      <Pencil size={13} className="text-[var(--accent)]" /> Rename Column
                                    </button>

                                    <div className="h-[1px] bg-[var(--border)] my-0.5" />

                                    <div className="px-2 py-1 text-[10px] uppercase font-mono text-[var(--text-dim)]">Reorder</div>
                                    <button
                                      onClick={() => { moveColumn(cIndex, 'left'); setActiveColMenu(null); }}
                                      disabled={isFirstCol}
                                      className="flex items-center gap-2 px-2 py-1 text-left rounded hover:bg-[var(--surface-3)] disabled:opacity-30 disabled:pointer-events-none text-[var(--text-primary)]"
                                    >
                                      <ChevronLeft size={13} /> Move Left
                                    </button>
                                    <button
                                      onClick={() => { moveColumn(cIndex, 'right'); setActiveColMenu(null); }}
                                      disabled={isLastCol}
                                      className="flex items-center gap-2 px-2 py-1 text-left rounded hover:bg-[var(--surface-3)] disabled:opacity-30 disabled:pointer-events-none text-[var(--text-primary)]"
                                    >
                                      <ChevronRight size={13} /> Move Right
                                    </button>
                                    <button
                                      onClick={() => { moveColumnToExtreme(cIndex, 'start'); setActiveColMenu(null); }}
                                      disabled={isFirstCol}
                                      className="flex items-center gap-2 px-2 py-1 text-left rounded hover:bg-[var(--surface-3)] disabled:opacity-30 disabled:pointer-events-none text-[var(--text-primary)]"
                                    >
                                      <ChevronsUp size={13} className="-rotate-90" /> Move to First
                                    </button>
                                    <button
                                      onClick={() => { moveColumnToExtreme(cIndex, 'end'); setActiveColMenu(null); }}
                                      disabled={isLastCol}
                                      className="flex items-center gap-2 px-2 py-1 text-left rounded hover:bg-[var(--surface-3)] disabled:opacity-30 disabled:pointer-events-none text-[var(--text-primary)]"
                                    >
                                      <ChevronsDown size={13} className="-rotate-90" /> Move to Last
                                    </button>

                                    <div className="h-[1px] bg-[var(--border)] my-0.5" />

                                    <div className="px-2 py-1 text-[10px] uppercase font-mono text-[var(--text-dim)]">Change Type</div>
                                    {(['TEXT', 'NUMBER', 'CURRENCY', 'DATE', 'BOOLEAN', 'SELECT', 'URL'] as Column['type'][]).map(t => (
                                      <button
                                        key={t}
                                        onClick={() => { changeColumnType(col.id, t); setActiveColMenu(null); }}
                                        className={`flex items-center justify-between px-2 py-1 text-left rounded hover:bg-[var(--surface-3)] ${col.type === t ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-primary)]'}`}
                                      >
                                        <span>{t}</span>
                                        {col.type === t && <Check size={11} />}
                                      </button>
                                    ))}

                                    <div className="h-[1px] bg-[var(--border)] my-0.5" />

                                    <button
                                      onClick={() => { deleteColumn(col.id); setActiveColMenu(null); }}
                                      className="flex items-center gap-2 px-2 py-1.5 text-left rounded hover:bg-[var(--danger)]/20 text-[var(--danger)]"
                                    >
                                      <Trash2 size={13} /> Delete Column
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </th>
                      );
                    })}

                    {/* Right spacer / Add column header */}
                    <th className="border border-[var(--border)] w-12 text-center p-2 bg-[var(--surface-3)]">
                      <button
                        onClick={handleOpenAddColModal}
                        className="p-1 rounded text-[var(--text-dim)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors"
                        title="Add column"
                      >
                        <Plus size={14} />
                      </button>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row: Row, rIndex: number) => {
                    const actualIndex = (activeSheet.rows || []).findIndex((r: any) => r.id === row.id);
                    const isFirstRow = actualIndex === 0;
                    const isLastRow = actualIndex === (activeSheet.rows.length - 1);
                    const rowHighlight = row.highlight || undefined;

                    return (
                      <tr 
                        key={row.id} 
                        className="group/row transition-colors"
                        style={{ backgroundColor: rowHighlight }}
                      >
                        {/* Row Control Column */}
                        <td className="border border-[var(--border)] text-center text-[var(--text-dim)] bg-[var(--surface-2)]/70 p-1 w-20 select-none">
                          <div className="flex items-center justify-between px-1">
                            <span className="font-mono text-xs text-[var(--text-dim)] w-5 text-right font-medium">
                              {actualIndex + 1}
                            </span>

                            {/* Move Up / Down Buttons */}
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => moveRow(actualIndex, 'up')}
                                disabled={isFirstRow}
                                title={isFirstRow ? 'First row' : 'Move row up'}
                                className="p-0.5 rounded text-[var(--text-dim)] hover:text-[var(--accent)] hover:bg-[var(--surface-3)] disabled:opacity-20 disabled:pointer-events-none transition-colors"
                              >
                                <ChevronUp size={13} />
                              </button>
                              <button
                                onClick={() => moveRow(actualIndex, 'down')}
                                disabled={isLastRow}
                                title={isLastRow ? 'Last row' : 'Move row down'}
                                className="p-0.5 rounded text-[var(--text-dim)] hover:text-[var(--accent)] hover:bg-[var(--surface-3)] disabled:opacity-20 disabled:pointer-events-none transition-colors"
                              >
                                <ChevronDown size={13} />
                              </button>
                            </div>

                            {/* Row Menu */}
                            <div className="relative worksheet-popover">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveRowMenu(activeRowMenu === row.id ? null : row.id);
                                }}
                                className="p-0.5 text-[var(--text-dim)] hover:text-white rounded opacity-0 group-hover/row:opacity-100 transition-opacity worksheet-menu-trigger"
                                title="Row options"
                              >
                                <MoreVertical size={13} />
                              </button>

                              {activeRowMenu === row.id && (
                                <div 
                                  onWheel={(e) => e.stopPropagation()}
                                  className={`absolute left-full ml-1 w-52 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-lg shadow-2xl p-1 z-50 text-xs flex flex-col gap-0.5 backdrop-blur-md max-h-[min(300px,calc(100vh-220px))] overflow-y-auto overscroll-contain ${
                                    actualIndex > (activeSheet.rows.length - 4) && actualIndex > 1 ? 'bottom-0' : 'top-0'
                                  }`}
                                >
                                  <button
                                    onClick={() => { moveRow(actualIndex, 'up'); setActiveRowMenu(null); }}
                                    disabled={isFirstRow}
                                    className="flex items-center gap-2 px-2 py-1 text-left rounded hover:bg-[var(--surface-3)] disabled:opacity-30 disabled:pointer-events-none text-[var(--text-primary)]"
                                  >
                                    <ChevronUp size={13} /> Move Up
                                  </button>
                                  <button
                                    onClick={() => { moveRow(actualIndex, 'down'); setActiveRowMenu(null); }}
                                    disabled={isLastRow}
                                    className="flex items-center gap-2 px-2 py-1 text-left rounded hover:bg-[var(--surface-3)] disabled:opacity-30 disabled:pointer-events-none text-[var(--text-primary)]"
                                  >
                                    <ChevronDown size={13} /> Move Down
                                  </button>
                                  <button
                                    onClick={() => { moveRowToExtreme(actualIndex, 'top'); setActiveRowMenu(null); }}
                                    disabled={isFirstRow}
                                    className="flex items-center gap-2 px-2 py-1 text-left rounded hover:bg-[var(--surface-3)] disabled:opacity-30 disabled:pointer-events-none text-[var(--text-primary)]"
                                  >
                                    <ChevronsUp size={13} /> Move to Top
                                  </button>
                                  <button
                                    onClick={() => { moveRowToExtreme(actualIndex, 'bottom'); setActiveRowMenu(null); }}
                                    disabled={isLastRow}
                                    className="flex items-center gap-2 px-2 py-1 text-left rounded hover:bg-[var(--surface-3)] disabled:opacity-30 disabled:pointer-events-none text-[var(--text-primary)]"
                                  >
                                    <ChevronsDown size={13} /> Move to Bottom
                                  </button>

                                  <div className="h-[1px] bg-[var(--border)] my-0.5" />

                                  <button
                                    onClick={() => { insertRowAt(actualIndex); setActiveRowMenu(null); }}
                                    className="flex items-center gap-2 px-2 py-1 text-left rounded hover:bg-[var(--surface-3)] text-[var(--text-primary)]"
                                  >
                                    <Plus size={13} className="text-[var(--accent)]" /> Insert Row Above
                                  </button>
                                  <button
                                    onClick={() => { insertRowAt(actualIndex + 1); setActiveRowMenu(null); }}
                                    className="flex items-center gap-2 px-2 py-1 text-left rounded hover:bg-[var(--surface-3)] text-[var(--text-primary)]"
                                  >
                                    <Plus size={13} className="text-[var(--accent)]" /> Insert Row Below
                                  </button>
                                  <button
                                    onClick={() => { duplicateRow(row.id); setActiveRowMenu(null); }}
                                    className="flex items-center gap-2 px-2 py-1 text-left rounded hover:bg-[var(--surface-3)] text-[var(--text-primary)]"
                                  >
                                    <Copy size={13} /> Duplicate Row
                                  </button>

                                  <div className="h-[1px] bg-[var(--border)] my-0.5" />

                                  <button
                                    onClick={() => { clearRowFormatting(row.id); setActiveRowMenu(null); }}
                                    className="flex items-center gap-2 px-2 py-1 text-left rounded hover:bg-[var(--surface-3)] text-[var(--text-dim)] hover:text-white"
                                  >
                                    <Eraser size={13} /> Clear Row Styling
                                  </button>

                                  <button
                                    onClick={() => { deleteRow(row.id); setActiveRowMenu(null); }}
                                    className="flex items-center gap-2 px-2 py-1.5 text-left rounded hover:bg-[var(--danger)]/20 text-[var(--danger)]"
                                  >
                                    <Trash2 size={13} /> Delete Row
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Cell Contents */}
                        {(activeSheet.columns || []).map((col: Column) => {
                          const isSelected = selectedCell?.rowId === row.id && selectedCell?.colId === col.id;
                          const cellStyle = row.styles?.[col.id];
                          const textColor = cellStyle?.color || undefined;
                          const cellBg = cellStyle?.bg || undefined;
                          const isBold = !!cellStyle?.bold;
                          const isItalic = !!cellStyle?.italic;

                          return (
                            <td 
                              key={col.id} 
                              onClick={() => setSelectedCell({ rowId: row.id, colId: col.id })}
                              className={`border border-[var(--border)] p-0 relative transition-all ${
                                isSelected ? 'ring-2 ring-[var(--accent)] z-10' : 'hover:bg-[var(--surface-3)]/40'
                              }`}
                              style={{ 
                                backgroundColor: cellBg,
                              }}
                            >
                              <div 
                                className="w-full h-full flex items-center"
                                style={{
                                  color: textColor,
                                  fontWeight: isBold ? 700 : undefined,
                                  fontStyle: isItalic ? 'italic' : undefined,
                                }}
                              >
                                {col.type === 'BOOLEAN' ? (
                                  <div className="flex justify-center items-center w-full p-2">
                                    <input 
                                      type="checkbox" 
                                      checked={!!row.cells[col.id]} 
                                      onChange={e => handleCellChange(row.id, col.id, e.target.checked)} 
                                      className="cursor-pointer accent-[var(--accent)] w-4 h-4 rounded"
                                    />
                                  </div>
                                ) : col.type === 'SELECT' ? (
                                  <select 
                                    value={row.cells[col.id] || ''} 
                                    onChange={e => handleCellChange(row.id, col.id, e.target.value)} 
                                    className="w-full h-full p-2 bg-transparent outline-none cursor-pointer"
                                    style={{
                                      color: textColor || 'inherit',
                                      fontWeight: isBold ? 700 : undefined,
                                      fontStyle: isItalic ? 'italic' : undefined,
                                    }}
                                  >
                                    <option value="" className="bg-[var(--surface)] text-[var(--text-dim)]">Select option...</option>
                                    {(col.options || []).map((opt: string) => (
                                      <option key={opt} value={opt} className="bg-[var(--surface-2)] text-[var(--text-primary)]">
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                ) : col.type === 'URL' ? (
                                  <div className="flex items-center w-full h-full">
                                    <input 
                                      type="text"
                                      value={row.cells[col.id] || ''}
                                      onChange={e => handleCellChange(row.id, col.id, e.target.value)}
                                      className="flex-1 p-2 bg-transparent outline-none focus:bg-[var(--surface-3)]/60"
                                      placeholder="https://..."
                                      style={{
                                        color: textColor || 'inherit',
                                        fontWeight: isBold ? 700 : undefined,
                                        fontStyle: isItalic ? 'italic' : undefined,
                                      }}
                                    />
                                    {row.cells[col.id] && (
                                      <a 
                                        href={row.cells[col.id].startsWith('http') ? row.cells[col.id] : `https://${row.cells[col.id]}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="p-1.5 text-[var(--text-dim)] hover:text-[var(--accent)]"
                                        title="Open link"
                                      >
                                        <ExternalLink size={12} />
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <div className="relative w-full h-full flex items-center">
                                    {col.type === 'CURRENCY' && (
                                      <span className="pl-2 text-[var(--text-dim)] font-mono text-xs select-none">$</span>
                                    )}
                                    <input 
                                      type={col.type === 'NUMBER' || col.type === 'CURRENCY' ? 'number' : col.type === 'DATE' ? 'date' : 'text'}
                                      value={row.cells[col.id] ?? ''}
                                      onChange={e => handleCellChange(row.id, col.id, e.target.value)}
                                      className="w-full h-full p-2 bg-transparent outline-none focus:bg-[var(--surface-3)]/60"
                                      style={{
                                        color: textColor || 'inherit',
                                        fontWeight: isBold ? 700 : undefined,
                                        fontStyle: isItalic ? 'italic' : undefined,
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        {/* Row Delete Button Column */}
                        <td className="border border-[var(--border)] text-center w-10">
                          <button 
                            onClick={() => deleteRow(row.id)} 
                            className="opacity-0 group-hover/row:opacity-100 p-1 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded transition-opacity"
                            title="Delete row"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {(!activeSheet.rows || activeSheet.rows.length === 0) && (
                <div className="p-12 text-center text-[var(--text-muted)] flex flex-col items-center justify-center gap-3">
                  <div className="text-sm">This worksheet has no rows yet.</div>
                  <button
                    onClick={addRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] text-black font-semibold rounded text-xs hover:brightness-110"
                  >
                    <Plus size={14} /> Add First Row
                  </button>
                </div>
              )}

              {activeSheet.rows && activeSheet.rows.length > 0 && filteredRows.length === 0 && (
                <div className="p-8 text-center text-xs text-[var(--text-dim)]">
                  No rows matching "{searchQuery}". <button onClick={() => setSearchQuery('')} className="text-[var(--accent)] underline ml-1">Clear filter</button>
                </div>
              )}
            </div>

            {/* Bottom Status Bar */}
            <div className="px-3 py-1.5 border-t border-[var(--border)] bg-[var(--surface-2)] flex justify-between items-center text-[11px] font-mono text-[var(--text-dim)]">
              <div className="flex items-center gap-3">
                <span>Total: {activeSheet.rows?.length || 0} rows</span>
                <span>·</span>
                <span>{activeSheet.columns?.length || 0} columns</span>
                {searchQuery && (
                  <>
                    <span>·</span>
                    <span className="text-[var(--accent)]">Showing {filteredRows.length} filtered rows</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent)]" />
                <span>Auto-saved</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] border border-[var(--border)] rounded-lg border-dashed p-8 bg-[var(--surface)]">
            <div className="text-lg font-semibold text-[var(--text-primary)] mb-2">No Worksheet Selected</div>
            <p className="text-sm text-[var(--text-dim)] mb-4">Select an existing worksheet from the list or create a new one.</p>
            <button
              onClick={createSheet}
              className="flex items-center gap-2 bg-[var(--accent)] text-black px-4 py-2 rounded font-bold hover:brightness-110 transition-all"
            >
              <Plus size={16} /> Create Worksheet
            </button>
          </div>
        )}
      </div>

      {/* Add Column Modal */}
      {isAddColModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] border border-[var(--border-strong)] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center p-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
              <div className="flex items-center gap-2 font-mono font-bold text-sm text-[var(--text-primary)]">
                <Columns3 size={16} className="text-[var(--accent)]" />
                <span>ADD NEW COLUMN</span>
              </div>
              <button 
                onClick={() => setIsAddColModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--text-muted)] mb-1">
                  Column Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g. Status, Deadline, Priority"
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateColumn();
                  }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--text-muted)] mb-1">
                  Column Type
                </label>
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value as Column['type'])}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="TEXT">Text (Standard)</option>
                  <option value="NUMBER">Number</option>
                  <option value="CURRENCY">Currency ($)</option>
                  <option value="DATE">Date</option>
                  <option value="BOOLEAN">Checkbox (Boolean)</option>
                  <option value="SELECT">Dropdown Selection</option>
                  <option value="URL">Web Link (URL)</option>
                </select>
              </div>

              {newColType === 'SELECT' && (
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--text-muted)] mb-1">
                    Dropdown Options (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newColOptions}
                    onChange={(e) => setNewColOptions(e.target.value)}
                    placeholder="e.g. Planning, In Progress, Complete, Blocked"
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                  <div className="text-[10px] text-[var(--text-dim)] mt-1">
                    Separate multiple choices with commas.
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddColModalOpen(false)}
                className="px-3 py-1.5 rounded text-xs text-[var(--text-muted)] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateColumn}
                className="px-4 py-1.5 bg-[var(--accent)] text-black font-bold rounded text-xs hover:brightness-110 shadow"
              >
                Add Column
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
