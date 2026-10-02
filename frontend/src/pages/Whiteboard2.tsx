import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useWhiteboards2 } from '../stores';
import { Tldraw, Editor } from 'tldraw';
import 'tldraw/tldraw.css';
import { Save, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

export function Whiteboard2() {
  const { items, fetch, update, add, remove } = useWhiteboards2();
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  
  const editorRef = useRef<Editor | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch();
  }, []);

  useEffect(() => {
    if (items.length > 0 && !currentBoardId) {
      setCurrentBoardId(items[0].id);
    } else if (items.length === 0 && !currentBoardId) {
      add({ name: 'Default Whiteboard 2', data: {} }).then(() => fetch());
    }
  }, [items, currentBoardId, add, fetch]);

  const activeBoard = items.find((b: any) => b.id === currentBoardId);

  const performSave = useCallback(async (editor: Editor, boardId: string) => {
    try {
      setSaveStatus('Saving...');
      const snapshot = editor.store.getSnapshot();
      await update(boardId, { data: snapshot });
      setSaveStatus('Saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      setSaveStatus('Error saving');
    }
  }, [update]);

  const onMount = useCallback((editor: Editor) => {
    editorRef.current = editor;

    // Auto-save on changes
    editor.store.listen(() => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        if (currentBoardId) {
          performSave(editor, currentBoardId);
        }
      }, 1000);
    }, { scope: 'document', source: 'user' });

  }, [currentBoardId, performSave]);

  const createNewBoard = async () => {
    await add({ name: 'New Whiteboard', data: {} });
    await fetch();
    const newItems = useWhiteboards2.getState().items;
    setCurrentBoardId(newItems[newItems.length - 1].id);
  };

  const deleteBoard = async (id: string) => {
    if (window.confirm("Delete this whiteboard?")) {
      await remove(id);
      if (currentBoardId === id) {
        setCurrentBoardId(null); // will select the first available on next render
      }
    }
  };

  const duplicateBoard = async (board: any) => {
    await add({ name: `${board.name} (Copy)`, data: board.data });
    await fetch();
    const newItems = useWhiteboards2.getState().items;
    setCurrentBoardId(newItems[newItems.length - 1].id);
  };

  const saveName = async () => {
    if (currentBoardId && editNameValue.trim()) {
      await update(currentBoardId, { name: editNameValue.trim() });
      setIsEditingName(false);
    }
  };

  // When switching boards, we want to unmount and remount Tldraw to avoid store mixing
  return (
    <div className="flex flex-col h-full bg-[var(--background)] -mx-8 -mb-8 overflow-hidden">
      {/* Header / Tabs */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--surface)] shrink-0 z-10">
        <div className="flex gap-2 items-center overflow-x-auto max-w-[70%] hide-scrollbar">
          {items.map((board: any) => (
            <button
              key={board.id}
              onClick={() => setCurrentBoardId(board.id)}
              className={`px-3 py-1.5 rounded whitespace-nowrap text-sm font-mono flex items-center gap-2 ${
                currentBoardId === board.id
                  ? 'bg-[var(--accent)] text-black font-bold'
                  : 'bg-[var(--surface-3)] text-[var(--text-muted)] hover:bg-[var(--surface-4)] hover:text-white'
              }`}
            >
              {board.name}
            </button>
          ))}
          <button 
            onClick={createNewBoard}
            className="p-1.5 bg-[var(--surface-3)] text-[var(--text-muted)] hover:bg-[var(--surface-4)] hover:text-white rounded ml-2"
            title="New Whiteboard"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex items-center gap-4 text-sm font-mono">
          {saveStatus && <span className="text-[var(--accent)] text-xs">{saveStatus}</span>}
          
          {activeBoard && currentBoardId && (
            <div className="flex items-center gap-2">
              <button onClick={() => duplicateBoard(activeBoard)} className="p-1.5 hover:bg-[var(--surface-3)] rounded text-xs">Duplicate</button>
              <button onClick={() => deleteBoard(currentBoardId)} className="p-1.5 text-[var(--danger)] hover:bg-[var(--danger)]/20 rounded"><Trash2 size={16}/></button>
              <button 
                onClick={() => {
                  if (editorRef.current) {
                    performSave(editorRef.current, currentBoardId);
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent)] text-black rounded font-bold hover:brightness-110 ml-2"
              >
                <Save size={16} /> Save Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title Editor */}
      {activeBoard && (
        <div className="px-4 py-2 bg-[var(--surface-2)] flex items-center gap-2 border-b border-[var(--border)] shrink-0 z-10">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={editNameValue} 
                onChange={e => setEditNameValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                className="bg-[var(--surface-3)] text-white px-2 py-1 rounded outline-none border border-[var(--accent)] text-sm font-mono"
                autoFocus
              />
              <button onClick={saveName} className="text-green-500 p-1 hover:bg-[var(--surface-4)] rounded"><Check size={16}/></button>
              <button onClick={() => setIsEditingName(false)} className="text-[var(--danger)] p-1 hover:bg-[var(--surface-4)] rounded"><X size={16}/></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[var(--text-primary)] font-mono">{activeBoard.name}</h2>
              <button 
                onClick={() => {
                  setEditNameValue(activeBoard.name);
                  setIsEditingName(true);
                }} 
                className="text-[var(--text-muted)] hover:text-white p-1 rounded hover:bg-[var(--surface-3)]"
              >
                <Edit2 size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Editor container */}
      <div className="flex-1 relative bg-white tldraw-wrapper">
        {currentBoardId && activeBoard && (
          <Tldraw 
            key={currentBoardId} // Force remount when board changes
            onMount={onMount}
            snapshot={activeBoard.data && Object.keys(activeBoard.data).length > 0 ? activeBoard.data : undefined}
          />
        )}
      </div>
    </div>
  );
}
