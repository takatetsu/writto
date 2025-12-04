import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// Base theme for the editor
export const baseTheme = EditorView.theme({
  '&': {
    lineHeight: '1.6',
    color: '#333',
  },
  '.cm-content': {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px 40px',
  },
  '.cm-line': {
    padding: '0',
  },
  // Headers
  '.cm-header-1': { fontSize: '2em', fontWeight: 'bold', borderBottom: '1px solid #eee', marginBottom: '0.5em' },
  '.cm-header-2': { fontSize: '1.5em', fontWeight: 'bold', borderBottom: '1px solid #eee', marginBottom: '0.5em' },
  '.cm-header-3': { fontSize: '1.25em', fontWeight: 'bold', marginBottom: '0.5em' },

  // Lists
  '.cm-list-ul': { paddingLeft: '20px' },

  // Code
  '.cm-inline-code': { backgroundColor: '#f5f5f5', borderRadius: '3px', padding: '2px 4px', fontFamily: 'monospace' },

  // Links
  '.cm-link': { color: '#007bff', textDecoration: 'underline', cursor: 'pointer' },
  '.cm-url': { color: '#0056b3', textDecoration: 'none' },

  // Blockquote
  '.cm-blockquote': { borderLeft: '4px solid #ccc', paddingLeft: '10px', color: '#666', marginLeft: '0' },

  // Horizontal Rule
  '.cm-hr': { borderTop: '2px solid #ddd', margin: '1em 0', display: 'block', lineHeight: '1px', fontSize: '1px' },

  // Table
  '.cm-table': { borderCollapse: 'collapse', width: '100%', marginBottom: '1em' },
  '.cm-table-head': { fontWeight: 'bold', borderBottom: '2px solid #ddd', backgroundColor: '#f9f9f9' },
  '.cm-table-row': { borderBottom: '1px solid #eee' },
  '.cm-table-cell': { padding: '8px', border: '1px solid #ddd' },

  // Code Block
  '.cm-codeblock-line': {
    backgroundColor: '#f6f8fa',
    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace',
    paddingLeft: '16px',
    paddingRight: '16px',
  },
  '.cm-codeblock-start': {
    borderTopLeftRadius: '6px',
    borderTopRightRadius: '6px',
    marginTop: '1em',
    paddingTop: '16px',
  },
  '.cm-codeblock-end': {
    borderBottomLeftRadius: '6px',
    borderBottomRightRadius: '6px',
    marginBottom: '1em',
    paddingBottom: '16px',
  },
});

// Syntax highlighting to apply classes
export const markdownHighlighting = HighlightStyle.define([
  { tag: t.heading1, class: 'cm-header-1' },
  { tag: t.heading2, class: 'cm-header-2' },
  { tag: t.heading3, class: 'cm-header-3' },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.monospace, class: 'cm-inline-code' },
  { tag: t.quote, class: 'cm-blockquote' },
  { tag: t.link, class: 'cm-link' },
  { tag: t.url, class: 'cm-url' },
  { tag: t.contentSeparator, class: 'cm-hr' },

  // Code Syntax Highlighting
  { tag: t.keyword, color: '#d73a49' },
  { tag: t.operator, color: '#d73a49' },
  { tag: t.comment, color: '#6a737d' },
  { tag: t.string, color: '#032f62' },
  { tag: t.number, color: '#005cc5' },
  { tag: t.bool, color: '#005cc5' },
  { tag: t.function(t.variableName), color: '#6f42c1' },
  { tag: t.definition(t.variableName), color: '#005cc5' },
  { tag: t.typeName, color: '#005cc5' },
  { tag: t.tagName, color: '#22863a' },
  { tag: t.attributeName, color: '#6f42c1' },
  { tag: t.variableName, color: '#24292e' }, // Standard text color for variables usually, or maybe a specific color
  { tag: t.className, color: '#6f42c1' },
  { tag: t.propertyName, color: '#005cc5' },
  { tag: t.regexp, color: '#032f62' },
  { tag: t.escape, color: '#032f62' },
  { tag: t.special(t.variableName), color: '#005cc5' }, // $var in bash often falls here
  { tag: t.local(t.variableName), color: '#24292e' },
  { tag: t.labelName, color: '#005cc5' },
  { tag: t.namespace, color: '#6f42c1' },
  { tag: t.macroName, color: '#6f42c1' },
]);

export const themeExtensions = [
  baseTheme,
  syntaxHighlighting(markdownHighlighting),
];
