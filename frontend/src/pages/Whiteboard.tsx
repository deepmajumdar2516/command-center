import React, { useEffect, useRef, useState } from 'react';
import { useWhiteboards } from '../stores';
import {
  Pen, Eraser, Square, Circle, Minus, MousePointer2, Type, Hand,
  Undo2, Redo2, Trash2, Save, Download, ZoomIn, ZoomOut, Maximize
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'text' | 'select' | 'pan';

interface DrawingElement {
  id: string;
  type: Tool;
  color: string;
  width: number;
  points: { x: number; y: number }[];
  text?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

export function Whiteboard() {
  const { items, fetch, update, add } = useWhiteboards();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [history, setHistory] = useState<DrawingElement[][]>([]);
  const [historyStep, setHistoryStep] = useState(0);
  
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#60a5fa');
  const [width, setWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  const [saveStatus, setSaveStatus] = useState('');
  
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    fetch();
  }, []);

  useEffect(() => {
    if (items.length > 0 && !currentBoardId) {
      const activeBoard = items[0];
      setCurrentBoardId(activeBoard.id);
      if (activeBoard.data) {
        setElements(activeBoard.data);
        setHistory([activeBoard.data]);
        setHistoryStep(0);
      }
    } else if (items.length === 0 && !currentBoardId) {
      // Create first board automatically
      add({ name: 'Default Whiteboard', data: [] }).then(() => fetch());
    }
  }, [items, currentBoardId, add, fetch]);

  const saveStateToHistory = (newElements: DrawingElement[]) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push([...newElements]);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      setElements(history[historyStep - 1]);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      setElements(history[historyStep + 1]);
    }
  };

  const clear = () => {
    if (window.confirm("Clear this whiteboard? This cannot be undone.")) {
      setElements([]);
      saveStateToHistory([]);
      if (currentBoardId) {
        update(currentBoardId, { data: [] });
      }
    }
  };

  const saveBoard = async () => {
    if (currentBoardId) {
      setSaveStatus('Saving...');
      await update(currentBoardId, { data: elements });
      setSaveStatus('SAVED');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const exportPNG = () => {
    if (elements.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach(el => {
      if (el.x !== undefined && el.y !== undefined) {
        const w = el.w || (el.type === 'text' ? 200 : 0);
        const h = el.h || (el.type === 'text' ? 50 : 0);
        minX = Math.min(minX, el.x, el.x + w);
        minY = Math.min(minY, el.y, el.y + h);
        maxX = Math.max(maxX, el.x, el.x + w);
        maxY = Math.max(maxY, el.y, el.y + h);
      }
      if (el.points) {
        el.points.forEach(p => {
          minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
        });
      }
    });

    if (minX === Infinity) return;

    const padding = 50;
    const w = maxX - minX + padding * 2;
    const h = maxY - minY + padding * 2;
    
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = w;
    tmpCanvas.height = h;
    const ctx = tmpCanvas.getContext('2d')!;
    
    // Draw background
    ctx.fillStyle = '#1e1e2e';
    ctx.fillRect(0, 0, w, h);
    
    // Translate to center the drawing
    ctx.translate(-minX + padding, -minY + padding);
    
    elements.forEach(el => drawElement(ctx, el));
    
    const url = tmpCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whiteboard.png';
    a.click();
  };

  const drawAll = (ctx: CanvasRenderingContext2D, elts: DrawingElement[]) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);
    elts.forEach(el => drawElement(ctx, el));
    ctx.restore();
  };

  const drawElement = (ctx: CanvasRenderingContext2D, el: DrawingElement) => {
    ctx.strokeStyle = el.type === 'eraser' ? '#1e1e2e' : el.color;
    ctx.lineWidth = el.type === 'eraser' ? el.width * 5 : el.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = el.color;

    if (el.type === 'pen' || el.type === 'eraser') {
      if (el.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(el.points[0].x, el.points[0].y);
      for (let i = 1; i < el.points.length; i++) {
        ctx.lineTo(el.points[i].x, el.points[i].y);
      }
      ctx.stroke();
    } else if (el.type === 'rectangle' && el.x !== undefined && el.y !== undefined && el.w !== undefined && el.h !== undefined) {
      ctx.strokeRect(el.x, el.y, el.w, el.h);
    } else if (el.type === 'circle' && el.x !== undefined && el.y !== undefined && el.w !== undefined && el.h !== undefined) {
      ctx.beginPath();
      ctx.ellipse(el.x + el.w/2, el.y + el.h/2, Math.abs(el.w/2), Math.abs(el.h/2), 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (el.type === 'line' && el.points.length === 2) {
      ctx.beginPath();
      ctx.moveTo(el.points[0].x, el.points[0].y);
      ctx.lineTo(el.points[1].x, el.points[1].y);
      ctx.stroke();
    } else if (el.type === 'text' && el.x !== undefined && el.y !== undefined && el.text) {
      ctx.font = `${el.width * 5}px monospace`;
      ctx.fillText(el.text, el.x, el.y);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setCanvasSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawAll(ctx, [...elements, ...(currentElement ? [currentElement] : [])]);
  }, [elements, currentElement, camera, canvasSize]);

  // Touch and mouse events
  const getPos = (e: any) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { 
      x: (clientX - rect.left - camera.x) / camera.zoom, 
      y: (clientY - rect.top - camera.y) / camera.zoom 
    };
  };

  const panStartRef = useRef<{x: number, y: number, camX: number, camY: number} | null>(null);

  const handleStart = (e: any) => {
    if (e.button !== undefined && e.button !== 0 && e.button !== 1) return;
    e.preventDefault(); // Always prevent default to avoid text selection or native dragging
    e.currentTarget.setPointerCapture(e.pointerId);
    
    const isMiddleClick = e.button === 1;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (tool === 'pan' || isMiddleClick) {
      panStartRef.current = {
        x: clientX,
        y: clientY,
        camX: camera.x,
        camY: camera.y
      };
      return;
    }

    const pos = getPos(e);

    if (tool === 'select') {
      // Find element clicked (reverse order to pick top-most)
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        let hit = false;
        if (el.type === 'rectangle' || el.type === 'circle' || el.type === 'text') {
          const w = el.w || (el.type === 'text' ? 100 : 0);
          const h = el.h || (el.type === 'text' ? 30 : 0);
          const minX = Math.min(el.x!, el.x! + w);
          const maxX = Math.max(el.x!, el.x! + w);
          const minY = Math.min(el.y!, el.y! + h);
          const maxY = Math.max(el.y!, el.y! + h);
          if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
            hit = true;
          }
        } else if (el.points && el.points.length > 0) {
          // Bounding box for lines/pen
          const minX = Math.min(...el.points.map(p => p.x));
          const maxX = Math.max(...el.points.map(p => p.x));
          const minY = Math.min(...el.points.map(p => p.y));
          const maxY = Math.max(...el.points.map(p => p.y));
          if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
            hit = true;
          }
        }

        if (hit) {
          setIsDrawing(true);
          // Set current element to the one being moved, remove it from elements temporarily
          setCurrentElement({ ...el, _dragStartX: pos.x, _dragStartY: pos.y } as any);
          setElements(elements.filter((_, idx) => idx !== i));
          return;
        }
      }
      return;
    }

    setIsDrawing(true);
    if (tool === 'text') {
      const txt = window.prompt('Enter text:');
      if (txt) {
        const newEl: DrawingElement = { id: uuidv4(), type: 'text', color, width, points: [], x: pos.x, y: pos.y, text: txt };
        const newElements = [...elements, newEl];
        setElements(newElements);
        saveStateToHistory(newElements);
      }
      setIsDrawing(false);
      return;
    }

    setCurrentElement({
      id: uuidv4(),
      type: tool,
      color,
      width,
      points: [pos],
      x: pos.x,
      y: pos.y,
      w: 0,
      h: 0
    });
  };

  const handleMove = (e: any) => {
    if (panStartRef.current) {
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = clientX - panStartRef.current.x;
      const dy = clientY - panStartRef.current.y;
      setCamera(prev => ({
        ...prev,
        x: panStartRef.current!.camX + dx,
        y: panStartRef.current!.camY + dy
      }));
      return;
    }

    if (!isDrawing || !currentElement) return;
    e.preventDefault();
    const pos = getPos(e);
    
    if (tool === 'select') {
      const dx = pos.x - (currentElement as any)._dragStartX;
      const dy = pos.y - (currentElement as any)._dragStartY;
      setCurrentElement(prev => {
        if (!prev) return null;
        const next = { ...prev, _dragStartX: pos.x, _dragStartY: pos.y } as any;
        if (next.x !== undefined) next.x += dx;
        if (next.y !== undefined) next.y += dy;
        if (next.points) {
          next.points = next.points.map((p: any) => ({ x: p.x + dx, y: p.y + dy }));
        }
        return next;
      });
    } else if (tool === 'pen' || tool === 'eraser') {
      setCurrentElement(prev => prev ? { ...prev, points: [...prev.points, pos] } : null);
    } else if (tool === 'rectangle' || tool === 'circle') {
      setCurrentElement(prev => prev ? { ...prev, w: pos.x - prev.x!, h: pos.y - prev.y! } : null);
    } else if (tool === 'line') {
      setCurrentElement(prev => prev ? { ...prev, points: [prev.points[0], pos] } : null);
    }
  };

  const handleEnd = (e: any) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    if (panStartRef.current) {
      panStartRef.current = null;
      return;
    }
    if (!isDrawing || !currentElement) return;
    setIsDrawing(false);
    const newElements = [...elements, currentElement];
    setElements(newElements);
    saveStateToHistory(newElements);
    setCurrentElement(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const isPinch = e.ctrlKey || e.metaKey;
      const isMouseWheel = !isPinch && Math.abs(e.deltaY) >= 50 && e.deltaY % 1 === 0 && e.deltaX === 0;

      if (isPinch || isMouseWheel) {
        // Zoom
        const zoomSensitivity = isPinch ? 0.01 : 0.002;
        const delta = -e.deltaY * zoomSensitivity;
        
        setCamera(prev => {
          let newZoom = prev.zoom * Math.exp(delta);
          if (newZoom < 0.05) newZoom = 0.05;
          if (newZoom > 10) newZoom = 10;
          
          const rect = canvas.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          const zoomFactor = newZoom / prev.zoom;
          
          return {
            x: mouseX - (mouseX - prev.x) * zoomFactor,
            y: mouseY - (mouseY - prev.y) * zoomFactor,
            zoom: newZoom
          };
        });
      } else {
        // Pan
        setCamera(prev => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [setCamera]);

  const resetZoom = () => setCamera({ x: 0, y: 0, zoom: 1 });
  const zoomIn = () => setCamera(p => ({ ...p, zoom: Math.min(10, p.zoom * 1.2) }));
  const zoomOut = () => setCamera(p => ({ ...p, zoom: Math.max(0.05, p.zoom / 1.2) }));

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold font-mono tracking-tight text-[var(--text-primary)]">Whiteboard</h2>
        <div className="flex gap-2 text-xs font-mono items-center">
          {saveStatus && <span className="text-[var(--accent)]">{saveStatus}</span>}
          <button onClick={undo} disabled={historyStep <= 0} className="p-2 hover:bg-[var(--surface-3)] rounded disabled:opacity-50"><Undo2 size={16} /></button>
          <button onClick={redo} disabled={historyStep >= history.length - 1} className="p-2 hover:bg-[var(--surface-3)] rounded disabled:opacity-50"><Redo2 size={16} /></button>
          <button onClick={clear} className="p-2 hover:bg-[var(--danger)]/20 text-[var(--danger)] rounded ml-2"><Trash2 size={16} /></button>
          <button onClick={saveBoard} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent)] text-black rounded font-bold hover:brightness-110 ml-2"><Save size={16} /> Save</button>
          <button onClick={exportPNG} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-3)] rounded hover:bg-[var(--surface-4)]"><Download size={16} /> Export</button>
        </div>
      </div>
      
      <div className="flex gap-4 mb-4 bg-[var(--surface)] p-2 rounded-lg border border-[var(--border)] overflow-x-auto">
        {/* Tools */}
        <div className="flex gap-1 border-r border-[var(--border)] pr-4">
          <ToolBtn icon={<Pen size={18}/>} active={tool==='pen'} onClick={()=>setTool('pen')} />
          <ToolBtn icon={<Eraser size={18}/>} active={tool==='eraser'} onClick={()=>setTool('eraser')} />
          <ToolBtn icon={<MousePointer2 size={18}/>} active={tool==='select'} onClick={()=>setTool('select')} />
          <ToolBtn icon={<Hand size={18}/>} active={tool==='pan'} onClick={()=>setTool('pan')} />
        </div>
        <div className="flex gap-1 border-r border-[var(--border)] pr-4">
          <ToolBtn icon={<Square size={18}/>} active={tool==='rectangle'} onClick={()=>setTool('rectangle')} />
          <ToolBtn icon={<Circle size={18}/>} active={tool==='circle'} onClick={()=>setTool('circle')} />
          <ToolBtn icon={<Minus size={18}/>} active={tool==='line'} onClick={()=>setTool('line')} />
          <ToolBtn icon={<Type size={18}/>} active={tool==='text'} onClick={()=>setTool('text')} />
        </div>
        
        {/* Colors & Width */}
        <div className="flex items-center gap-3 border-r border-[var(--border)] pr-4">
          <input type="color" value={color} onChange={e=>setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0" />
          <input type="range" min="1" max="20" value={width} onChange={e=>setWidth(parseInt(e.target.value))} className="w-24" />
        </div>

        {/* Zoom */}
        <div className="flex gap-1 items-center">
          <ToolBtn icon={<ZoomOut size={18}/>} active={false} onClick={zoomOut} />
          <span className="text-xs text-[var(--text-muted)] font-mono w-10 text-center">{Math.round(camera.zoom * 100)}%</span>
          <ToolBtn icon={<ZoomIn size={18}/>} active={false} onClick={zoomIn} />
          <ToolBtn icon={<Maximize size={18}/>} active={false} onClick={resetZoom} />
        </div>
      </div>

      <div ref={containerRef} className="flex-1 bg-[#1e1e2e] rounded-lg border border-[var(--border)] overflow-hidden relative cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          className="block touch-none"
          onPointerDown={handleStart}
          onPointerMove={handleMove}
          onPointerUp={handleEnd}
          onPointerCancel={handleEnd}
        />
      </div>
    </div>
  );
}

function ToolBtn({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-2 rounded transition-colors ${active ? 'bg-[var(--accent)] text-black' : 'text-[var(--text-muted)] hover:bg-[var(--surface-3)]'}`}
    >
      {icon}
    </button>
  );
}
