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

  // Lists - hanging indent for wrapped lines
  '.cm-list-ul': { paddingLeft: '20px' },

  // Hanging indent for bullet list items (using line decoration class)
  '.cm-hanging-indent-bullet': {
    paddingLeft: '1.9em',
    textIndent: '-1.9em',
  },

  // Hanging indent for checkbox items (using line decoration class)
  '.cm-hanging-indent-checkbox': {
    paddingLeft: '2em',
    textIndent: '-2em',
  },

  // Hanging indent for ordered list items (1. 2. 3.) (using line decoration class)
  '.cm-hanging-indent-number': {
    paddingLeft: '1.8em',
    textIndent: '-1.8em',
  },

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
    marginLeft: 'var(--blockquote-indent, 0px)',
    color: 'var(--text-secondary)',
  },
  // Nested blockquote levels - show multiple bars using background gradient
  '.cm-blockquote-level-2': {
    borderLeft: 'none',
    background: 'linear-gradient(to right, var(--blockquote-border, #d0d7de) 4px, transparent 4px, transparent 20px, var(--blockquote-border, #d0d7de) 20px, var(--blockquote-border, #d0d7de) 24px, transparent 24px)',
    paddingLeft: '40px',
    marginLeft: 'var(--blockquote-indent, 0px)',
  },
  '.cm-blockquote-level-3': {
    borderLeft: 'none',
    background: 'linear-gradient(to right, var(--blockquote-border, #d0d7de) 4px, transparent 4px, transparent 20px, var(--blockquote-border, #d0d7de) 20px, var(--blockquote-border, #d0d7de) 24px, transparent 24px, transparent 40px, var(--blockquote-border, #d0d7de) 40px, var(--blockquote-border, #d0d7de) 44px, transparent 44px)',
    paddingLeft: '60px',
    marginLeft: 'var(--blockquote-indent, 0px)',
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
    position: 'relative',
  },
  '.cm-codeblock-start': {
    borderTopLeftRadius: '6px',
    borderTopRightRadius: '6px',
    borderTop: '1px solid var(--border-color)',
  },
  // Add visual padding above the first line using ::before
  '.cm-codeblock-start::before': {
    content: '""',
    display: 'block',
    height: '12px',
    marginLeft: '-16px',
    marginRight: '-16px',
    backgroundColor: 'var(--bg-tertiary)',
    borderTopLeftRadius: '6px',
    borderTopRightRadius: '6px',
  },
  '.cm-codeblock-end': {
    borderBottomLeftRadius: '6px',
    borderBottomRightRadius: '6px',
    borderBottom: '1px solid var(--border-color)',
  },
  // Add visual padding below the last line using ::after
  '.cm-codeblock-end::after': {
    content: '""',
    display: 'block',
    height: '12px',
    marginLeft: '-16px',
    marginRight: '-16px',
    backgroundColor: 'var(--bg-tertiary)',
    borderBottomLeftRadius: '6px',
    borderBottomRightRadius: '6px',
  },
  // Code Block Widget (for non-focused state)
  '.cm-codeblock-widget': {
    display: 'block',
    margin: '1em 0',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
  },
  '.cm-codeblock-header': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 12px',
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    fontSize: '0.85em',
  },
  '.cm-codeblock-lang': {
    color: 'var(--text-muted)',
    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace',
    textTransform: 'lowercase',
  },
  '.cm-codeblock-copy-btn': {
    marginLeft: 'auto',
    padding: '3px 10px',
    fontSize: '0.85em',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  '.cm-codeblock-copy-btn:hover': {
    backgroundColor: 'var(--hover-bg)',
    color: 'var(--text-primary)',
  },
  '.cm-codeblock-copy-success': {
    backgroundColor: 'var(--success-bg, rgba(46, 160, 67, 0.15))',
    color: 'var(--success-color, #2ea043)',
    borderColor: 'var(--success-color, #2ea043)',
  },
  '.cm-codeblock-widget pre': {
    margin: '0',
    padding: '12px 16px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    backgroundColor: 'var(--bg-tertiary)',
  },
  '.cm-codeblock-widget code': {
    display: 'block',
  },

  // Details (collapsible) widget
  '.cm-details-widget': {
    display: 'block',
    margin: '0.5em 0',
    padding: '8px 12px',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
  },
  '.cm-details-summary': {
    cursor: 'pointer',
    fontWeight: 'bold',
    padding: '4px 0',
    color: 'var(--text-primary)',
    userSelect: 'none',
  },
  '.cm-details-summary:hover': {
    color: 'var(--text-secondary)',
  },
  '.cm-details-content': {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid var(--border-light)',
    lineHeight: '1.6',
  },
  // Reset all margins inside details content
  '.cm-details-content > *:first-child': {
    marginTop: '0',
  },
  '.cm-details-content > *:last-child': {
    marginBottom: '0',
  },
  // Normalize margins inside details content to match editor
  '.cm-details-content h1, .cm-details-content h2, .cm-details-content h3, .cm-details-content h4, .cm-details-content h5, .cm-details-content h6': {
    margin: '0',
    lineHeight: '1.4',
  },
  '.cm-details-content h1': {
    fontSize: '2em',
    fontWeight: 'bold',
    borderBottom: '1px solid var(--border-light)',
  },
  '.cm-details-content h2': {
    fontSize: '1.5em',
    fontWeight: 'bold',
    borderBottom: '1px solid var(--border-light)',
  },
  '.cm-details-content h3': {
    fontSize: '1.25em',
    fontWeight: 'bold',
  },
  '.cm-details-content pre': {
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '6px',
    padding: '16px',
    overflow: 'auto',
    margin: '0',
    border: '1px solid var(--border-light)',
  },
  '.cm-details-content code': {
    fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace',
    fontSize: '0.9em',
  },
  '.cm-details-content p': {
    margin: '0',
  },
  '.cm-details-content ul, .cm-details-content ol': {
    margin: '0',
    paddingLeft: '1.5em',
  },
  '.cm-details-content li': {
    margin: '0',
  },
  '.cm-details-content blockquote': {
    margin: '0',
    paddingLeft: '1em',
    borderLeft: '4px solid var(--blockquote-border, #d0d7de)',
    color: 'var(--text-secondary)',
  },
  '.cm-details-hint': {
    marginLeft: '12px',
    fontSize: '0.7em',
    color: 'var(--text-muted)',
    fontWeight: 'normal',
    opacity: '0',
    transition: 'opacity 0.2s',
  },
  '.cm-details-summary:hover .cm-details-hint': {
    opacity: '0.7',
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

  // Mermaid diagram widget
  '.cm-mermaid-widget': {
    display: 'block',
    margin: '1em 0',
    padding: '16px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    textAlign: 'center',
    overflow: 'auto',
  },
  '.cm-mermaid-widget svg': {
    maxWidth: '100%',
    height: 'auto',
  },
  '.cm-mermaid-error': {
    color: 'var(--error-color, #dc3545)',
    padding: '12px',
    backgroundColor: 'var(--error-bg, rgba(220, 53, 69, 0.1))',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.9em',
    textAlign: 'left',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
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
