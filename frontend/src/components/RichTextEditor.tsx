import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Strike } from '@tiptap/extension-strike';
import { Highlight } from '@tiptap/extension-highlight';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextAlign } from '@tiptap/extension-text-align';
import { Extension } from '@tiptap/core';

import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Highlighter, Palette, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Indent as IndentIcon, Outdent as OutdentIcon,
  RemoveFormatting, Undo2, Redo2, ChevronDown, Check, Type, Plus, Minus
} from 'lucide-react';

// Custom Strike with Ctrl+Shift+X support
const CustomStrike = Strike.extend({
  addKeyboardShortcuts() {
    return {
      'Mod-Shift-x': () => this.editor.commands.toggleStrike(),
      'Mod-Shift-X': () => this.editor.commands.toggleStrike(),
    };
  },
});

// Custom Indent extension for blocks
const IndentExtension = Extension.create({
  name: 'indent',
  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote'],
      minLevel: 0,
      maxLevel: 6,
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const left = element.style.marginLeft;
              if (left) {
                const px = parseInt(left, 10);
                return Math.round(px / 24);
              }
              return 0;
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent <= 0) return {};
              return { style: `margin-left: ${attributes.indent * 24}px` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent < this.options.maxLevel) {
                tr = tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: currentIndent + 1,
                });
                changed = true;
              }
            }
          });
          if (changed && dispatch) {
            dispatch(tr);
            return true;
          }
          return false;
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent > this.options.minLevel) {
                tr = tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: currentIndent - 1,
                });
                changed = true;
              }
            }
          });
          if (changed && dispatch) {
            dispatch(tr);
            return true;
          }
          return false;
        },
    };
  },
});

const PRESET_COLORS = [
  { label: 'Default', value: 'inherit', color: 'var(--text-primary)' },
  { label: 'White', value: '#ffffff', color: '#ffffff' },
  { label: 'Emerald Accent', value: '#00d4aa', color: '#00d4aa' },
  { label: 'Sky Blue', value: '#38bdf8', color: '#38bdf8' },
  { label: 'Royal Blue', value: '#60a5fa', color: '#60a5fa' },
  { label: 'Cyber Purple', value: '#c084fc', color: '#c084fc' },
  { label: 'Neon Pink', value: '#f472b6', color: '#f472b6' },
  { label: 'Coral Red', value: '#ff4466', color: '#ff4466' },
  { label: 'Solar Amber', value: '#fb923c', color: '#fb923c' },
  { label: 'Bright Yellow', value: '#facc15', color: '#facc15' },
  { label: 'Lime Green', value: '#a3e635', color: '#a3e635' },
  { label: 'Muted Slate', value: '#94a3b8', color: '#94a3b8' },
];

const PRESET_HIGHLIGHTS = [
  { label: 'Classic Yellow', value: '#fef08a' },
  { label: 'Mint Green', value: '#bbf7d0' },
  { label: 'Sky Blue', value: '#bae6fd' },
  { label: 'Rose Pink', value: '#fbcfe8' },
  { label: 'Warm Orange', value: '#fed7aa' },
  { label: 'Soft Purple', value: '#e9d5ff' },
  { label: 'Cyber Teal', value: '#99f6e4' },
];

const FONT_FAMILIES = [
  { label: 'Inter (Sans)', value: 'Inter, sans-serif' },
  { label: 'JetBrains (Mono)', value: "'JetBrains Mono', monospace" },
  { label: 'Georgia (Serif)', value: 'Georgia, serif' },
  { label: 'System UI', value: 'system-ui, sans-serif' },
  { label: 'Handwriting', value: "'Comic Sans MS', cursive" },
];

const FONT_SIZE_STEPS = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px'];

interface RichTextEditorProps {
  noteId: string;
  initialContent: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
}

export function RichTextEditor({
  noteId,
  initialContent,
  onChange,
  onBlur,
}: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showFontFamilyDropdown, setShowFontFamilyDropdown] = useState(false);
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);

  const colorPickerRef = useRef<HTMLDivElement>(null);
  const highlightPickerRef = useRef<HTMLDivElement>(null);
  const fontFamilyRef = useRef<HTMLDivElement>(null);
  const fontSizeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        strike: false, // Use CustomStrike with shortcut
      }),
      CustomStrike,
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      FontSize,
      Color,
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      IndentExtension,
    ],
    content: initialContent || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onBlur: () => {
      if (onBlur) onBlur();
    },
    editorProps: {
      attributes: {
        class: 'tiptap ProseMirror p-6 outline-none text-[var(--text-primary)] min-h-[350px] font-sans text-sm',
      },
    },
  });

  // When noteId changes, update editor content cleanly
  const currentNoteIdRef = useRef(noteId);
  useEffect(() => {
    if (editor && noteId !== currentNoteIdRef.current) {
      currentNoteIdRef.current = noteId;
      editor.commands.setContent(initialContent || '', false);
    }
  }, [noteId, initialContent, editor]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
      if (highlightPickerRef.current && !highlightPickerRef.current.contains(e.target as Node)) {
        setShowHighlightPicker(false);
      }
      if (fontFamilyRef.current && !fontFamilyRef.current.contains(e.target as Node)) {
        setShowFontFamilyDropdown(false);
      }
      if (fontSizeRef.current && !fontSizeRef.current.contains(e.target as Node)) {
        setShowFontSizeDropdown(false);
      }
      if (headingRef.current && !headingRef.current.contains(e.target as Node)) {
        setShowHeadingDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  // Active state helpers
  const isBold = editor.isActive('bold');
  const isItalic = editor.isActive('italic');
  const isUnderline = editor.isActive('underline');
  const isStrike = editor.isActive('strike');
  const isHighlight = editor.isActive('highlight');
  const isBulletList = editor.isActive('bulletList');
  const isOrderedList = editor.isActive('orderedList');

  const textStyleAttrs = editor.getAttributes('textStyle') || {};
  const activeColor = textStyleAttrs.color;
  const activeFontSize = textStyleAttrs.fontSize || '14px';
  const activeFontFamily = textStyleAttrs.fontFamily;
  const activeHighlight = (editor.getAttributes('highlight') || {}).color;

  const currentFontFamilyLabel =
    FONT_FAMILIES.find((f) => f.value === activeFontFamily)?.label.split(' ')[0] || 'Font';

  const activeHeading = editor.isActive('heading', { level: 1 })
    ? 'H1'
    : editor.isActive('heading', { level: 2 })
    ? 'H2'
    : editor.isActive('heading', { level: 3 })
    ? 'H3'
    : 'Normal';

  const isAlignLeft = editor.isActive({ textAlign: 'left' });
  const isAlignCenter = editor.isActive({ textAlign: 'center' });
  const isAlignRight = editor.isActive({ textAlign: 'right' });
  const isAlignJustify = editor.isActive({ textAlign: 'justify' });

  // Font size step handlers
  const handleIncreaseFontSize = () => {
    const currentIdx = FONT_SIZE_STEPS.indexOf(activeFontSize);
    const nextIdx = currentIdx < FONT_SIZE_STEPS.length - 1 ? currentIdx + 1 : currentIdx;
    editor.chain().focus().setFontSize(FONT_SIZE_STEPS[nextIdx]).run();
  };

  const handleDecreaseFontSize = () => {
    const currentIdx = FONT_SIZE_STEPS.indexOf(activeFontSize);
    const prevIdx = currentIdx > 0 ? currentIdx - 1 : 0;
    editor.chain().focus().setFontSize(FONT_SIZE_STEPS[prevIdx]).run();
  };

  // List & indent handlers
  const handleIndent = () => {
    if (editor.isActive('listItem')) {
      editor.chain().focus().sinkListItem('listItem').run();
    } else {
      (editor.commands as any).indent?.();
    }
  };

  const handleOutdent = () => {
    if (editor.isActive('listItem')) {
      editor.chain().focus().liftListItem('listItem').run();
    } else {
      (editor.commands as any).outdent?.();
    }
  };

  const handleClearFormatting = () => {
    editor
      .chain()
      .focus()
      .clearNodes()
      .unsetAllMarks()
      .unsetColor()
      .unsetFontSize()
      .unsetFontFamily()
      .unsetHighlight()
      .run();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--surface)] overflow-hidden">
      {/* ======================================================== */}
      {/* RICH TEXT FORMATTING TOOLBAR */}
      {/* ======================================================== */}
      <div className="border-b border-[var(--border)] bg-[var(--surface-2)]/90 px-3 py-2 flex flex-wrap items-center gap-1 z-20 text-xs">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-[var(--border)]">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={15} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
          >
            <Redo2 size={15} />
          </button>
        </div>

        {/* Headings Selector Dropdown */}
        <div className="relative" ref={headingRef}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
            className="px-2.5 py-1.5 rounded bg-[var(--surface-3)] hover:bg-[var(--border)] text-[var(--text-primary)] font-mono font-semibold flex items-center gap-1.5 transition-colors"
            title="Headings & Paragraph"
          >
            <span>{activeHeading}</span>
            <ChevronDown size={13} className="text-[var(--text-muted)]" />
          </button>

          {showHeadingDropdown && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-1.5 space-y-1 z-30">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor.chain().focus().setParagraph().run();
                  setShowHeadingDropdown(false);
                }}
                className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                  activeHeading === 'Normal'
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-semibold'
                    : 'text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <span>Normal Text</span>
                {activeHeading === 'Normal' && <Check size={14} />}
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                  setShowHeadingDropdown(false);
                }}
                className={`w-full px-2.5 py-1.5 rounded-lg text-left text-base font-bold flex items-center justify-between transition-colors ${
                  activeHeading === 'H1'
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                    : 'text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <span>Heading 1</span>
                {activeHeading === 'H1' && <Check size={14} />}
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                  setShowHeadingDropdown(false);
                }}
                className={`w-full px-2.5 py-1.5 rounded-lg text-left text-sm font-semibold flex items-center justify-between transition-colors ${
                  activeHeading === 'H2'
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                    : 'text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <span>Heading 2</span>
                {activeHeading === 'H2' && <Check size={14} />}
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 3 }).run();
                  setShowHeadingDropdown(false);
                }}
                className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                  activeHeading === 'H3'
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                    : 'text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <span>Heading 3</span>
                {activeHeading === 'H3' && <Check size={14} />}
              </button>
            </div>
          )}
        </div>

        {/* Font Family Selector */}
        <div className="relative" ref={fontFamilyRef}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowFontFamilyDropdown(!showFontFamilyDropdown)}
            className="px-2.5 py-1.5 rounded bg-[var(--surface-3)] hover:bg-[var(--border)] text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
            title="Font Family"
          >
            <Type size={14} className="text-[var(--text-muted)]" />
            <span className="max-w-[75px] truncate">{currentFontFamilyLabel}</span>
            <ChevronDown size={12} className="text-[var(--text-muted)]" />
          </button>

          {showFontFamilyDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-1.5 space-y-1 z-30">
              {FONT_FAMILIES.map((font) => (
                <button
                  key={font.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor.chain().focus().setFontFamily(font.value).run();
                    setShowFontFamilyDropdown(false);
                  }}
                  style={{ fontFamily: font.value }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-[var(--text-primary)] hover:bg-[var(--surface-2)] flex items-center justify-between transition-colors"
                >
                  <span>{font.label}</span>
                  {activeFontFamily === font.value && <Check size={14} className="text-[var(--accent)]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Size Selector & Increase/Decrease */}
        <div className="flex items-center gap-0.5 bg-[var(--surface-3)] rounded-lg p-0.5" ref={fontSizeRef}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleDecreaseFontSize}
            className="p-1 rounded hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-white transition-colors"
            title="Decrease font size"
          >
            <Minus size={12} />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowFontSizeDropdown(!showFontSizeDropdown)}
            className="px-1.5 py-0.5 font-mono text-xs text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors flex items-center gap-0.5"
            title="Select font size"
          >
            <span>{activeFontSize}</span>
            <ChevronDown size={10} className="text-[var(--text-muted)]" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleIncreaseFontSize}
            className="p-1 rounded hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-white transition-colors"
            title="Increase font size"
          >
            <Plus size={12} />
          </button>

          {showFontSizeDropdown && (
            <div className="absolute top-full left-auto mt-1 w-32 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-1.5 space-y-0.5 z-30">
              {FONT_SIZE_STEPS.map((size) => (
                <button
                  key={size}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor.chain().focus().setFontSize(size).run();
                    setShowFontSizeDropdown(false);
                  }}
                  className={`w-full px-2 py-1 rounded-lg text-left text-xs font-mono transition-colors flex items-center justify-between ${
                    activeFontSize === size
                      ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-bold'
                      : 'text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <span>{size}</span>
                  {activeFontSize === size && <Check size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-[var(--border)] mx-1" />

        {/* Bold, Italic, Underline, Strikethrough */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded transition-colors ${
              isBold
                ? 'bg-[var(--accent)] text-black font-bold'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-3)]'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold size={15} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded transition-colors ${
              isItalic
                ? 'bg-[var(--accent)] text-black'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-3)]'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic size={15} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded transition-colors ${
              isUnderline
                ? 'bg-[var(--accent)] text-black'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-3)]'
            }`}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon size={15} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded transition-colors ${
              isStrike
                ? 'bg-[var(--accent)] text-black'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-3)]'
            }`}
            title="Strikethrough (Ctrl+Shift+X)"
          >
            <Strikethrough size={15} />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-[var(--border)] mx-1" />

        {/* Text Color Tool */}
        <div className="relative" ref={colorPickerRef}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1.5 rounded hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-white flex items-center gap-1 transition-colors"
            title="Text Color"
          >
            <div className="flex flex-col items-center">
              <Palette size={15} />
              <div
                className="w-3.5 h-1 rounded-full mt-0.5"
                style={{ backgroundColor: activeColor || 'var(--accent)' }}
              />
            </div>
            <ChevronDown size={11} />
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-3 z-30 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] uppercase">
                <span>Text Color</span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor.chain().focus().unsetColor().run();
                    setShowColorPicker(false);
                  }}
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  Reset
                </button>
              </div>

              {/* Predefined Palette */}
              <div className="grid grid-cols-6 gap-2">
                {PRESET_COLORS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (item.value === 'inherit') {
                        editor.chain().focus().unsetColor().run();
                      } else {
                        editor.chain().focus().setColor(item.value).run();
                      }
                      setShowColorPicker(false);
                    }}
                    style={{ backgroundColor: item.color }}
                    className="w-7 h-7 rounded-lg border border-black/30 hover:scale-110 transition-transform shadow-sm flex items-center justify-center cursor-pointer relative"
                    title={item.label}
                  >
                    {activeColor === item.value && (
                      <Check size={14} className="text-black drop-shadow" />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Color Input */}
              <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2">
                <span className="text-[11px] text-[var(--text-muted)] font-mono">Custom Color:</span>
                <input
                  type="color"
                  value={activeColor && activeColor.startsWith('#') ? activeColor : '#00d4aa'}
                  onChange={(e) => {
                    editor.chain().focus().setColor(e.target.value).run();
                  }}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  title="Pick custom hex color"
                />
              </div>
            </div>
          )}
        </div>

        {/* Highlight Color Tool */}
        <div className="relative" ref={highlightPickerRef}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowHighlightPicker(!showHighlightPicker)}
            className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
              isHighlight
                ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-3)]'
            }`}
            title="Text Highlighter"
          >
            <div className="flex flex-col items-center">
              <Highlighter size={15} />
              <div
                className="w-3.5 h-1 rounded-full mt-0.5"
                style={{ backgroundColor: activeHighlight || '#fef08a' }}
              />
            </div>
            <ChevronDown size={11} />
          </button>

          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-3 z-30 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] uppercase">
                <span>Highlight Color</span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                    setShowHighlightPicker(false);
                  }}
                  className="text-xs text-[var(--danger)] hover:underline"
                >
                  Remove
                </button>
              </div>

              {/* Highlight Palette */}
              <div className="grid grid-cols-4 gap-2">
                {PRESET_HIGHLIGHTS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      editor.chain().focus().toggleHighlight({ color: item.value }).run();
                      setShowHighlightPicker(false);
                    }}
                    style={{ backgroundColor: item.value }}
                    className="h-8 rounded-lg border border-black/20 hover:scale-105 transition-transform shadow-sm flex items-center justify-center text-[10px] font-bold text-gray-900 cursor-pointer"
                    title={item.label}
                  >
                    A
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-[var(--border)] mx-1" />

        {/* Alignment */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1.5 rounded transition-colors ${
              isAlignLeft
                ? 'bg-[var(--accent)] text-black'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-3)]'
            }`}
            title="Align Left"
          >
            <AlignLeft size={15} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1.5 rounded transition-colors ${
              isAlignCenter
                ? 'bg-[var(--accent)] text-black'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-3)]'
            }`}
            title="Align Center"
          >
            <AlignCenter size={15} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-1.5 rounded transition-colors ${
              isAlignRight
                ? 'bg-[var(--accent)] text-black'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-3)]'
            }`}
            title="Align Right"
          >
            <AlignRight size={15} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-1.5 rounded transition-colors ${
              isAlignJustify
                ? 'bg-[var(--accent)] text-black'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-3)]'
            }`}
            title="Justify"
          >
            <AlignJustify size={15} />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-[var(--border)] mx-1" />

        {/* Lists & Indentation */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded transition-colors ${
              isBulletList
                ? 'bg-[var(--accent)] text-black'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-3)]'
            }`}
            title="Bullet List"
          >
            <List size={15} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded transition-colors ${
              isOrderedList
                ? 'bg-[var(--accent)] text-black'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-3)]'
            }`}
            title="Numbered List"
          >
            <ListOrdered size={15} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleOutdent}
            className="p-1.5 rounded hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-white transition-colors"
            title="Decrease Indent"
          >
            <OutdentIcon size={15} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleIndent}
            className="p-1.5 rounded hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-white transition-colors"
            title="Increase Indent"
          >
            <IndentIcon size={15} />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-[var(--border)] mx-1" />

        {/* Clear Formatting */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClearFormatting}
          className="p-1.5 rounded hover:bg-[var(--danger)]/15 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors ml-auto"
          title="Clear Formatting on selected text"
        >
          <RemoveFormatting size={15} />
        </button>
      </div>

      {/* ======================================================== */}
      {/* EDITOR CONTENT CANVAS */}
      {/* ======================================================== */}
      <div className="flex-1 overflow-y-auto cursor-text bg-transparent">
        <EditorContent editor={editor} />
      </div>

      {/* Word / Character Count Footer */}
      <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--surface-2)]/60 text-[10px] text-[var(--text-dim)] font-mono flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span>{editor.storage.characterCount?.words?.() ?? editor.getText().trim().split(/\s+/).filter(Boolean).length} words</span>
          <span>•</span>
          <span>{editor.getText().length} characters</span>
        </div>
        <div className="text-[10px] text-[var(--text-dim)] hidden sm:block">
          Rich Text Editor • Markdown & Shortcuts Enabled
        </div>
      </div>
    </div>
  );
}