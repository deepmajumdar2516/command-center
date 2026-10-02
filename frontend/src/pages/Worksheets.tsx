import React, { useEffect, useState } from 'react';
import { useWorksheets } from '../stores';
import { Plus, Trash2, Columns, Copy, Edit2 } from 'lucide-react';

export function Worksheets() {
  const { items, fetch, update, add, remove, loading } = useWorksheets();
  const [activeSheet, setActiveSheet] = useState<any>(null);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (items.length > 0 && !activeSheet) {
      setActiveSheet(items[0]);
    }
  }, [items]);

  const handleCellChange = (rowId: string, colId: string, value: any) => {
    if (!activeSheet) return;
    const newRows = activeSheet.rows.map((r: any) => 
      r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: value } } : r
    );
    const updatedSheet = { ...activeSheet, rows: newRows };
    setActiveSheet(updatedSheet);
    update(activeSheet.id, { rows: newRows });
  };

  const addRow = () => {
    if (!activeSheet) return;
    const newRows = [...(activeSheet.rows || []), { id: crypto.randomUUID(), cells: {} }];
    const updatedSheet = { ...activeSheet, rows: newRows };
    setActiveSheet(updatedSheet);
    update(activeSheet.id, { rows: newRows });
  };

  const addColumn = () => {
    if (!activeSheet) return;
    const name = window.prompt("Column name:");
    if (!name) return;
    const type = window.prompt("Type (TEXT, NUMBER, DATE, BOOLEAN, SELECT, URL, CURRENCY):")?.toUpperCase() || 'TEXT';
    
    const newCols = [...(activeSheet.columns || []), { id: crypto.randomUUID(), name, type }];
    const updatedSheet = { ...activeSheet, columns: newCols };
    setActiveSheet(updatedSheet);
    update(activeSheet.id, { columns: newCols });
  };

  const deleteRow = (rowId: string) => {
    if (!activeSheet || !window.confirm('Delete row?')) return;
    const newRows = activeSheet.rows.filter((r: any) => r.id !== rowId);
    const updatedSheet = { ...activeSheet, rows: newRows };
    setActiveSheet(updatedSheet);
    update(activeSheet.id, { rows: newRows });
  };

  const deleteColumn = (colId: string) => {
    if (!activeSheet || !window.confirm('Delete column?')) return;
    const newCols = activeSheet.columns.filter((c: any) => c.id !== colId);
    const newRows = activeSheet.rows.map((r: any) => {
      const { [colId]: removed, ...rest } = r.cells;
      return { ...r, cells: rest };
    });
    const updatedSheet = { ...activeSheet, columns: newCols, rows: newRows };
    setActiveSheet(updatedSheet);
    update(activeSheet.id, { columns: newCols, rows: newRows });
  };

  const createSheet = () => {
    add({
      name: 'New Worksheet',
      columns: [{ id: crypto.randomUUID(), name: 'Column 1', type: 'TEXT' }],
      rows: []
    });
  };

  if (loading && !activeSheet) return <div className="p-8 text-[var(--text-muted)]">Loading worksheets...</div>;

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-mono text-[var(--accent)]">Worksheets</h1>
        <button onClick={createSheet} className="flex items-center gap-2 bg-[var(--accent)] text-black px-4 py-2 rounded font-bold hover:brightness-110">
          <Plus size={16} /> New Worksheet
        </button>
      </div>

      <div className="flex gap-4">
        {/* Sidebar List */}
        <div className="w-64 flex flex-col gap-2 border-r border-[var(--border)] pr-4">
          {items.map((sheet: any) => (
            <div 
              key={sheet.id}
              onClick={() => setActiveSheet(sheet)}
              className={`p-3 rounded border cursor-pointer flex justify-between items-center group ${activeSheet?.id === sheet.id ? 'bg-[var(--surface-3)] border-[var(--accent)] text-[var(--text-primary)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'}`}
            >
              <span className="font-bold truncate">{sheet.name}</span>
              <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete worksheet?')) remove(sheet.id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-[var(--danger)]">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Detail View / Spreadsheet */}
        {activeSheet ? (
          <div className="flex-1 flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-2)] flex justify-between items-center">
              <input 
                value={activeSheet.name} 
                onChange={(e) => {
                  const updated = { ...activeSheet, name: e.target.value };
                  setActiveSheet(updated);
                  update(activeSheet.id, { name: e.target.value });
                }}
                className="bg-transparent text-xl font-bold outline-none text-[var(--text-primary)] focus:border-b border-[var(--accent)]" 
              />
              <div className="flex gap-2">
                <button onClick={addColumn} className="px-3 py-1.5 bg-[var(--surface-3)] rounded text-sm flex items-center gap-2 hover:bg-[var(--surface-4)]"><Columns size={14}/> Add Column</button>
                <button onClick={addRow} className="px-3 py-1.5 bg-[var(--surface-3)] rounded text-sm flex items-center gap-2 hover:bg-[var(--surface-4)]"><Plus size={14}/> Add Row</button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-[var(--surface-3)]">
                  <tr>
                    <th className="border border-[var(--border)] w-12 text-center text-[var(--text-dim)]">#</th>
                    {(activeSheet.columns || []).map((col: any) => (
                      <th key={col.id} className="border border-[var(--border)] p-2 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] group relative">
                        <div className="flex justify-between items-center pr-4">
                          <span>{col.name} <span className="text-[8px] opacity-50 ml-1">{col.type}</span></span>
                          <button onClick={() => deleteColumn(col.id)} className="opacity-0 group-hover:opacity-100 absolute right-1 text-[var(--danger)] hover:bg-[var(--danger)]/10 p-0.5 rounded">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </th>
                    ))}
                    <th className="border border-[var(--border)] w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {(activeSheet.rows || []).map((row: any, rIndex: number) => (
                    <tr key={row.id} className="hover:bg-[var(--surface-2)] group/row">
                      <td className="border border-[var(--border)] text-center text-[var(--text-dim)] bg-[var(--surface-2)]">{rIndex + 1}</td>
                      {(activeSheet.columns || []).map((col: any) => (
                        <td key={col.id} className="border border-[var(--border)] p-0">
                          {col.type === 'BOOLEAN' ? (
                            <div className="flex justify-center p-2">
                              <input type="checkbox" checked={!!row.cells[col.id]} onChange={e => handleCellChange(row.id, col.id, e.target.checked)} />
                            </div>
                          ) : col.type === 'SELECT' ? (
                            <select value={row.cells[col.id] || ''} onChange={e => handleCellChange(row.id, col.id, e.target.value)} className="w-full h-full p-2 bg-transparent outline-none">
                              <option value=""></option>
                              {(col.options || []).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          ) : (
                            <input 
                              type={col.type === 'NUMBER' || col.type === 'CURRENCY' ? 'number' : col.type === 'DATE' ? 'date' : 'text'}
                              value={row.cells[col.id] || ''}
                              onChange={e => handleCellChange(row.id, col.id, e.target.value)}
                              className="w-full h-full p-2 bg-transparent outline-none focus:bg-[var(--surface-3)]"
                              placeholder={col.type === 'URL' ? 'https://...' : ''}
                            />
                          )}
                        </td>
                      ))}
                      <td className="border border-[var(--border)] text-center">
                        <button onClick={() => deleteRow(row.id)} className="opacity-0 group-hover/row:opacity-100 p-1 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded m-1">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!activeSheet.rows || activeSheet.rows.length === 0) && (
                <div className="p-8 text-center text-[var(--text-muted)]">No rows. Click "Add Row" to start.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] border border-[var(--border)] rounded border-dashed">
            Select or create a worksheet
          </div>
        )}
      </div>
    </div>
  );
}
