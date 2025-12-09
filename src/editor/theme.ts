import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// Base theme for the editor using CSS variables for dark mode support
export const baseTheme = EditorView.theme({
  '&': {
    lineHeight: '1.6',
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-primary)',
  },
  '.cm-content': {
    margin: '0 auto',
    padding: '20px 40px',
    caretColor: 'var(--text-primary)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--text-primary)',
  },
  '.cm-line': {
    padding: '0',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-muted)',
    borderRight: '1px solid var(--border-color)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--hover-bg)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--bg-tertiary)',
  },
  // Headers
  '.cm-header-1': { fontSize: '2em', fontWeight: 'bold', borderBottom: '1px solid var(--border-light)', marginBottom: '0.5em' },
  '.cm-header-2': { fontSize: '1.5em', fontWeight: 'bold', borderBottom: '1px solid var(--border-light)', marginBottom: '0.5em' },
  '.cm-header-3': { fontSize: '1.25em', fontWeight: 'bold', marginBottom: '0.5em' },

  // Lists
  '.cm-list-ul': { paddingLeft: '20px' },

  // Code
  '.cm-inline-code': { backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', padding: '2px 4px', fontFamily: 'monospace' },

  // Links
  '.cm-link': { color: '#58a6ff', textDecoration: 'underline', cursor: 'pointer' },
  '.cm-url': { color: '#58a6ff', textDecoration: 'none' },

  // Blockquote
  '.cm-blockquote': { color: 'var(--text-secondary)' },
  '.cm-blockquote-line': {
    borderLeft: '4px solid var(--blockquote-border, #d0d7de)',
    paddingLeft: '16px',
    color: 'var(--text-secondary)',
  },
  // Nested blockquote levels - show multiple bars using background gradient
  '.cm-blockquote-level-2': {
    borderLeft: 'none',
    background: 'linear-gradient(to right, var(--blockquote-border, #d0d7de) 4px, transparent 4px, transparent 20px, var(--blockquote-border, #d0d7de) 20px, var(--blockquote-border, #d0d7de) 24px, transparent 24px)',
    paddingLeft: '40px',
  },
  '.cm-blockquote-level-3': {
    borderLeft: 'none',
    background: 'linear-gradient(to right, var(--blockquote-border, #d0d7de) 4px, transparent 4px, transparent 20px, var(--blockquote-border, #d0d7de) 20px, var(--blockquote-border, #d0d7de) 24px, transparent 24px, transparent 40px, var(--blockquote-border, #d0d7de) 40px, var(--blockquote-border, #d0d7de) 44px, transparent 44px)',
    paddingLeft: '60px',
  },

  // Horizontal Rule
  '.cm-hr': { borderTop: '2px solid var(--border-color)', margin: '1em 0', display: 'block', lineHeight: '1px', fontSize: '1px' },

  // Table
  '.cm-table': { borderCollapse: 'collapse', width: '100%', marginBottom: '1em' },
  '.cm-table-head': { fontWeight: 'bold', borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' },
  '.cm-table-row': { borderBottom: '1px solid var(--border-light)' },
  '.cm-table-cell': { padding: '8px', border: '1px solid var(--border-color)' },

  // Code Block
  '.cm-codeblock-line': {
    backgroundColor: 'var(--bg-tertiary)',
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

  // Selection - using multiple selectors to ensure it works
  '.cm-selectionBackground': {
    backgroundColor: 'var(--selection-bg) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--selection-bg) !important',
  },
  '.cm-selectionLayer .cm-selectionBackground': {
    backgroundColor: 'var(--selection-bg) !important',
  },
  '.cm-line ::selection': {
    backgroundColor: 'var(--selection-bg) !important',
  },
  '& ::selection': {
    backgroundColor: 'var(--selection-bg) !important',
  },

  // Syntax highlighting classes (using CSS variables)
  '.cm-syntax-keyword': { color: 'var(--syntax-keyword)' },
  '.cm-syntax-string': { color: 'var(--syntax-string)' },
  '.cm-syntax-number': { color: 'var(--syntax-number)' },
  '.cm-syntax-comment': { color: 'var(--syntax-comment)' },
  '.cm-syntax-function': { color: 'var(--syntax-function)' },
  '.cm-syntax-variable': { color: 'var(--syntax-variable)' },
  '.cm-syntax-operator': { color: 'var(--syntax-operator)' },
});

// Syntax highlighting to apply classes (using CSS classes for dark mode compatibility)
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

  // Code Syntax Highlighting - using CSS classes for dark mode compatibility
  { tag: t.keyword, class: 'cm-syntax-keyword' },
  { tag: t.operator, class: 'cm-syntax-operator' },
  { tag: t.comment, class: 'cm-syntax-comment' },
  { tag: t.string, class: 'cm-syntax-string' },
  { tag: t.number, class: 'cm-syntax-number' },
  { tag: t.bool, class: 'cm-syntax-number' },
  { tag: t.function(t.variableName), class: 'cm-syntax-function' },
  { tag: t.definition(t.variableName), class: 'cm-syntax-number' },
  { tag: t.typeName, class: 'cm-syntax-number' },
  { tag: t.tagName, class: 'cm-syntax-keyword' },
  { tag: t.attributeName, class: 'cm-syntax-function' },
  { tag: t.variableName, class: 'cm-syntax-variable' },
  { tag: t.className, class: 'cm-syntax-function' },
  { tag: t.propertyName, class: 'cm-syntax-number' },
  { tag: t.regexp, class: 'cm-syntax-string' },
  { tag: t.escape, class: 'cm-syntax-string' },
  { tag: t.special(t.variableName), class: 'cm-syntax-number' },
  { tag: t.local(t.variableName), class: 'cm-syntax-variable' },
  { tag: t.labelName, class: 'cm-syntax-number' },
  { tag: t.namespace, class: 'cm-syntax-function' },
  { tag: t.macroName, class: 'cm-syntax-function' },
]);

export const themeExtensions = [
  baseTheme,
  syntaxHighlighting(markdownHighlighting),
];
