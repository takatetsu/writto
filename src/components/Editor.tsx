import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { GFM } from "@lezer/markdown";
import { GFMWithoutSetext } from "../editor/markdown-config";
import { languages } from "@codemirror/language-data";
import { openSearchPanel, searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldKeymap } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { hybridView, baseDirFacet } from '../editor/hybrid-view';
import { themeExtensions } from '../editor/theme';
import { checkboxPlugin } from '../editor/checkbox-plugin';
import { excelPasteHandler } from '../editor/paste-handler';
import { TableInsertDialog } from './TableInsertDialog';
import { getInitialLanguage, translations } from '../lib/i18n';

export interface EditorHandle {
  scrollToLine: (line: number) => void;
  triggerSearch: () => void;
}

interface EditorProps {
  initialDoc?: string;
  onChange?: (doc: string) => void;
  settings?: { fontSize: number; fontFamily: string; editorWidth?: number };
  showLineNumbers?: boolean;
  wordWrap?: boolean;
  activeFileDir?: string;
  isPlainText?: boolean;
}

const Editor = forwardRef<EditorHandle, EditorProps>(({ initialDoc = "", onChange, settings, showLineNumbers = true, wordWrap = false, activeFileDir, isPlainText = false }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeCompartment = useRef(new Compartment());
  const lineNumberCompartment = useRef(new Compartment());
  const wordWrapCompartment = useRef(new Compartment());
  const baseDirCompartment = useRef(new Compartment());

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const lastTableOperationTime = useRef<number>(0);

  // Adjust context menu position to stay within viewport
  useEffect(() => {
    if (contextMenu && contextMenuRef.current) {
      const menu = contextMenuRef.current;
      const rect = menu.getBoundingClientRect();
      let { x, y } = contextMenu;

      if (rect.right > window.innerWidth) {
        x = window.innerWidth - rect.width - 10;
      }
      if (rect.bottom > window.innerHeight) {
        y = window.innerHeight - rect.height - 10;
      }

      if (x !== contextMenu.x || y !== contextMenu.y) {
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
      }
    }
  }, [contextMenu]);

  // Get translations
  const lang = getInitialLanguage();
  const t = translations[lang];

  // Generate Markdown table template
  const generateMarkdownTable = (rows: number, cols: number): string => {
    const headerRow = '| ' + Array(cols).fill('Header').map((h, i) => `${h}${i + 1}`).join(' | ') + ' |';
    const separatorRow = '| ' + Array(cols).fill('---').join(' | ') + ' |';
    const dataRows = Array(rows - 1).fill(null).map(() =>
      '| ' + Array(cols).fill('     ').join(' | ') + ' |'
    ).join('\n');

    return `\n${headerRow}\n${separatorRow}\n${dataRows}\n`;
  };

  // Insert table at cursor position
  const handleInsertTable = (rows: number, cols: number) => {
    if (!viewRef.current) return;

    const tableMarkdown = generateMarkdownTable(rows, cols);
    const cursorPos = viewRef.current.state.selection.main.head;

    viewRef.current.dispatch({
      changes: { from: cursorPos, to: cursorPos, insert: tableMarkdown }
    });
    viewRef.current.focus();
  };

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    // Only show custom menu for markdown files
    if (isPlainText) return;

    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Handle table operation events from TableWidget
  const handleTableOperation = (e: CustomEvent) => {
    e.stopPropagation();

    // Debounce: prevent processing same operation twice within 100ms
    const now = Date.now();
    if (now - lastTableOperationTime.current < 100) {
      return;
    }
    lastTableOperationTime.current = now;

    if (!viewRef.current) return;

    const { operation, rowIndex, colIndex, from, to } = e.detail;
    const doc = viewRef.current.state.doc;
    const tableText = doc.sliceString(from, to);
    const lines = tableText.split('\n').filter(l => l.trim() !== '');

    if (lines.length < 2) return;

    // Parse first line to get accurate column count
    const parseRow = (line: string): string[] => {
      const trimmed = line.trim();
      const inner = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
      const final = inner.endsWith('|') ? inner.slice(0, -1) : inner;
      return final.split('|');
    };

    const numCols = parseRow(lines[0]).length;
    let newTableText = '';

    switch (operation) {
      case 'addRowAbove': {
        const newRow = '|' + Array(numCols).fill('     ').join('|') + '|';
        // rowIndex -1 means header, rowIndex 0 is first data row (line index 2)
        const insertLineIndex = rowIndex === -1 ? 2 : rowIndex + 2;
        const newLines = [...lines];
        newLines.splice(insertLineIndex, 0, newRow);
        newTableText = newLines.join('\n');
        break;
      }
      case 'addRowBelow': {
        const newRow = '|' + Array(numCols).fill('     ').join('|') + '|';
        const insertLineIndex = rowIndex === -1 ? 2 : rowIndex + 3;
        const newLines = [...lines];
        newLines.splice(Math.min(insertLineIndex, newLines.length), 0, newRow);
        newTableText = newLines.join('\n');
        break;
      }
      case 'addColumnLeft': {
        newTableText = lines.map((line, i) => {
          const cells = parseRow(line);
          if (i === 1) {
            // Separator row
            cells.splice(colIndex, 0, '---');
          } else {
            cells.splice(colIndex, 0, '     ');
          }
          return '|' + cells.join('|') + '|';
        }).join('\n');
        break;
      }
      case 'addColumnRight': {
        newTableText = lines.map((line, i) => {
          const cells = parseRow(line);
          if (i === 1) {
            cells.splice(colIndex + 1, 0, '---');
          } else {
            cells.splice(colIndex + 1, 0, '     ');
          }
          return '|' + cells.join('|') + '|';
        }).join('\n');
        break;
      }
      case 'deleteRow': {
        if (lines.length <= 3) return; // Keep at least header + separator + 1 row
        const deleteLineIndex = rowIndex + 2;
        const newLines = lines.filter((_, i) => i !== deleteLineIndex);
        newTableText = newLines.join('\n');
        break;
      }
      case 'deleteColumn': {
        if (numCols <= 1) return; // Keep at least 1 column
        newTableText = lines.map(line => {
          const cells = parseRow(line);
          cells.splice(colIndex, 1);
          return '|' + cells.join('|') + '|';
        }).join('\n');
        break;
      }
      default:
        return;
    }

    if (newTableText) {
      viewRef.current.dispatch({
        changes: { from, to, insert: newTableText }
      });
    }
  };

  useImperativeHandle(ref, () => ({
    scrollToLine: (line: number) => {
      if (viewRef.current) {
        const lineInfo = viewRef.current.state.doc.line(line);
        viewRef.current.dispatch({
          effects: EditorView.scrollIntoView(lineInfo.from, { y: 'start' }),
          selection: { anchor: lineInfo.from }
        });
      }
    },
    triggerSearch: () => {
      if (viewRef.current) {
        openSearchPanel(viewRef.current);
      }
    }
  }));

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: initialDoc,
      extensions: [
        // Decomposed basicSetup
        lineNumberCompartment.current.of(showLineNumbers ? lineNumbers() : []),
        wordWrapCompartment.current.of(wordWrap ? EditorView.lineWrapping : []),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        dropCursor(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
          indentWithTab,
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
        ]),

        // Japanese localization for search
        EditorState.phrases.of({
          "Find": "検索",
          "Replace": "置換",
          "next": "次へ",
          "previous": "前へ",
          "all": "すべて",
          "match case": "大文字小文字を区別",
          "by word": "単語単位",
          "replace": "置換",
          "replace all": "すべて置換",
          "close": "閉じる",
          "regexp": "正規表現",
        }),

        // Only enable markdown extensions for non-plain text files
        ...(isPlainText ? [] : [
          markdown({ codeLanguages: languages, extensions: [GFM, GFMWithoutSetext] }),
          checkboxPlugin,
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onChange) {
            onChange(update.state.doc.toString());
          }
        }),
        themeExtensions,
        themeCompartment.current.of(EditorView.theme({
          "&": {
            height: "100%",
            fontSize: `${settings?.fontSize || 14}px !important`,
            fontFamily: `${settings?.fontFamily || 'Consolas, monospace'} !important`
          },
          ".cm-scroller": {
            overflow: "auto",
            fontSize: `${settings?.fontSize || 14}px !important`,
            fontFamily: `${settings?.fontFamily || 'Consolas, monospace'} !important`
          },
          ".cm-content": {
            width: `${settings?.editorWidth || 100}%`,
            maxWidth: `${settings?.editorWidth || 100}%`,
            margin: "0 auto",
            padding: (settings?.editorWidth || 100) === 100 ? "20px 0" : "20px 40px",
            fontSize: `${settings?.fontSize || 14}px !important`,
            fontFamily: `${settings?.fontFamily || 'Consolas, monospace'} !important`
          },
          ".cm-line": {
            fontSize: `${settings?.fontSize || 14}px !important`,
            fontFamily: `${settings?.fontFamily || 'Consolas, monospace'} !important`
          }
        })),
        // Only enable hybrid markdown rendering for markdown files
        ...(isPlainText ? [] : [
          baseDirCompartment.current.of(baseDirFacet.of(activeFileDir || '')),
          hybridView,
        ]),
        // Excel paste handler - always enabled
        excelPasteHandler,
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    // Listen for scroll-to-anchor custom events from LinkWidget
    const handleScrollToAnchor = (e: Event) => {
      const customEvent = e as CustomEvent<{ anchorId: string }>;
      const anchorId = customEvent.detail?.anchorId;

      if (!anchorId || !viewRef.current) return;

      const doc = viewRef.current.state.doc;
      const normalizedAnchor = anchorId.toLowerCase().replace(/-/g, ' ');

      for (let i = 1; i <= doc.lines; i++) {
        const line = doc.line(i);
        const text = line.text;

        // Check if this is a heading line
        const headingMatch = text.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
          const headingText = headingMatch[2].trim();
          // Normalize heading text for comparison (support Japanese characters)
          const normalizedHeading = headingText.toLowerCase()
            .replace(/[^\w\s\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

          if (normalizedHeading === normalizedAnchor ||
            headingText.toLowerCase() === anchorId.toLowerCase()) {
            // Scroll to this line
            viewRef.current.dispatch({
              effects: EditorView.scrollIntoView(line.from, { y: 'start' }),
              selection: { anchor: line.from }
            });
            viewRef.current.focus();
            return;
          }
        }
      }
    };

    editorRef.current.addEventListener('scroll-to-anchor', handleScrollToAnchor);

    // Listen for table operation events from TableWidget
    const tableOperationHandler = (e: Event) => handleTableOperation(e as CustomEvent);
    editorRef.current.addEventListener('table-operation', tableOperationHandler);

    return () => {
      editorRef.current?.removeEventListener('scroll-to-anchor', handleScrollToAnchor);
      editorRef.current?.removeEventListener('table-operation', tableOperationHandler);
      view.destroy();
    };
  }, [isPlainText]); // Recreate editor when isPlainText changes

  // Update settings
  useEffect(() => {
    if (viewRef.current && settings) {
      console.log('Updating editor settings:', settings);
      console.log('Editor width:', settings.editorWidth);
      viewRef.current.dispatch({
        effects: themeCompartment.current.reconfigure(EditorView.theme({
          "&": {
            height: "100%",
            fontSize: `${settings.fontSize}px !important`,
            fontFamily: `${settings.fontFamily} !important`
          },
          ".cm-scroller": {
            overflow: "auto",
            fontSize: `${settings.fontSize}px !important`,
            fontFamily: `${settings.fontFamily} !important`
          },
          ".cm-content": {
            width: `${settings.editorWidth || 100}%`,
            maxWidth: `${settings.editorWidth || 100}%`,
            margin: "0 auto",
            padding: (settings.editorWidth || 100) === 100 ? "20px 0" : "20px 40px",
            fontSize: `${settings.fontSize}px !important`,
            fontFamily: `${settings.fontFamily} !important`
          },
          ".cm-line": {
            fontSize: `${settings.fontSize}px !important`,
            fontFamily: `${settings.fontFamily} !important`
          }
        }))
      });
    }
  }, [settings?.fontSize, settings?.fontFamily, settings?.editorWidth]);

  // Update line numbers
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: lineNumberCompartment.current.reconfigure(showLineNumbers ? lineNumbers() : [])
      });
    }
  }, [showLineNumbers]);

  // Update word wrap
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: wordWrapCompartment.current.reconfigure(wordWrap ? EditorView.lineWrapping : [])
      });
    }
  }, [wordWrap]);

  // Update base dir
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: baseDirCompartment.current.reconfigure(baseDirFacet.of(activeFileDir || ''))
      });
    }
  }, [activeFileDir]);

  // Update doc if it changes externally (e.g. file open)
  useEffect(() => {
    if (viewRef.current && initialDoc !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: initialDoc }
      });
    }
  }, [initialDoc]);

  return (
    <>
      <div
        ref={editorRef}
        style={{ height: "100%", width: "100%" }}
        onContextMenu={handleContextMenu}
        onClick={closeContextMenu}
      />

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 10000,
            padding: '4px 0',
            minWidth: '160px',
          }}
        >
          {/* Standard editing operations */}
          {[
            { key: 'context.cut', action: () => document.execCommand('cut') },
            { key: 'context.copy', action: () => document.execCommand('copy') },
            {
              key: 'context.paste', action: async () => {
                const text = await navigator.clipboard.readText();
                if (viewRef.current) {
                  const { from, to } = viewRef.current.state.selection.main;
                  viewRef.current.dispatch({ changes: { from, to, insert: text } });
                }
              }
            },
            {
              key: 'context.selectAll', action: () => {
                if (viewRef.current) {
                  viewRef.current.dispatch({
                    selection: { anchor: 0, head: viewRef.current.state.doc.length }
                  });
                }
              }
            },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => { closeContextMenu(); item.action(); }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.9em',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover-bg)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {t[item.key as keyof typeof t]}
            </button>
          ))}

          {/* Separator */}
          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />

          {/* Table insert */}
          <button
            onClick={() => {
              closeContextMenu();
              setShowTableDialog(true);
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.9em',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover-bg)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {t['table.insert']}
          </button>
        </div>
      )}

      {/* Table Insert Dialog */}
      <TableInsertDialog
        isOpen={showTableDialog}
        onClose={() => setShowTableDialog(false)}
        onInsert={handleInsertTable}
      />
    </>
  );
});

export default Editor;
