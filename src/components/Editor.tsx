import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { GFM } from "@lezer/markdown";
import { languages } from "@codemirror/language-data";
import { openSearchPanel, searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldKeymap } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { hybridView, baseDirFacet } from '../editor/hybrid-view';
import { themeExtensions } from '../editor/theme';
import { checkboxPlugin } from '../editor/checkbox-plugin';

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
}

const Editor = forwardRef<EditorHandle, EditorProps>(({ initialDoc = "", onChange, settings, showLineNumbers = true, wordWrap = false, activeFileDir }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeCompartment = useRef(new Compartment());
  const lineNumberCompartment = useRef(new Compartment());
  const wordWrapCompartment = useRef(new Compartment());
  const baseDirCompartment = useRef(new Compartment());

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

        markdown({ codeLanguages: languages, extensions: [GFM] }),
        checkboxPlugin,
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
        baseDirCompartment.current.of(baseDirFacet.of(activeFileDir || '')),
        hybridView,
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

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

  return <div ref={editorRef} style={{ height: "100%", width: "100%" }} />;
});

export default Editor;
