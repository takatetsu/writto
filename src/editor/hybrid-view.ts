import { RangeSetBuilder, StateField, EditorState } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { TableWidget, TableData } from './table-widget';

class BulletWidget extends WidgetType {
  toDOM() {
    const span = document.createElement('span');
    span.textContent = '・';
    span.style.fontWeight = 'bold';
    span.style.marginRight = '5px';
    return span;
  }
  ignoreEvent() { return false; }
}

class LinkWidget extends WidgetType {
  constructor(readonly text: string, readonly url: string) {
    super();
  }
  eq(other: LinkWidget) { return other.text === this.text && other.url === this.url; }
  toDOM() {
    const a = document.createElement('a');
    a.textContent = this.text;
    a.href = this.url;
    a.target = '_blank';
    a.style.cursor = 'pointer';
    a.style.textDecoration = 'underline';
    a.style.color = '#007bff';
    return a;
  }
  ignoreEvent() { return false; }
}

function computeHybridDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const selection = state.selection.main;

  syntaxTree(state).iterate({
    enter: (node) => {
      if (node.name === 'StrongEmphasis' || node.name === 'Emphasis') {
        if (selection.from >= node.from && selection.to <= node.to) return;

        let c = node.node.cursor();
        c.firstChild();
        do {
          if (c.name === 'EmphasisMark') {
            builder.add(c.from, c.to, Decoration.replace({}));
          }
        } while (c.nextSibling());
      }
      else if (node.name.startsWith('ATXHeading')) {
        if (selection.from >= node.from && selection.to <= node.to) return;

        let c = node.node.cursor();
        c.firstChild();
        do {
          if (c.name === 'HeaderMark') {
            builder.add(c.from, c.to, Decoration.replace({}));
          }
        } while (c.nextSibling());
      }
      else if (node.name === 'ListMark') {
        const text = state.sliceDoc(node.from, node.to);
        if (['-', '*', '+'].includes(text)) {
          builder.add(node.from, node.to, Decoration.replace({
            widget: new BulletWidget()
          }));
        }
      }
      else if (node.name === 'Link') {
        if (selection.from >= node.from && selection.to <= node.to) return;

        const text = state.sliceDoc(node.from, node.to);
        const match = text.match(/^\[(.*?)\]\((.*?)\)/);
        if (match) {
          builder.add(node.from, node.to, Decoration.replace({
            widget: new LinkWidget(match[1], match[2])
          }));
          return false;
        }
      }
      else if (node.name === 'Table') {
        // Only render when not focused
        if (selection.from >= node.from && selection.to <= node.to) return;

        // Safety check for empty range
        if (node.to <= node.from) return;

        const tableData: TableData = {
          headers: [],
          rows: [],
          alignments: []
        };

        let cursor = node.node.cursor();
        if (cursor.firstChild()) {
          // Process TableHeader
          if (cursor.name === 'TableHeader') {
            let headerCursor = cursor.node.cursor();
            if (headerCursor.firstChild()) {
              do {
                if (headerCursor.name === 'TableCell') {
                  tableData.headers.push(state.sliceDoc(headerCursor.from, headerCursor.to));
                }
              } while (headerCursor.nextSibling());
            }
          }

          // Process Delimiter Row to determine alignment
          let child = node.node.firstChild;
          let headerNode = null;
          let firstRowNode = null;

          while (child) {
            if (child.name === 'TableHeader') headerNode = child;
            if (child.name === 'TableRow' && !firstRowNode) firstRowNode = child;
            child = child.nextSibling;
          }

          if (headerNode) {
            const headerEndLine = state.doc.lineAt(headerNode.to);
            if (headerEndLine.number < state.doc.lines) {
              const delimiterLine = state.doc.line(headerEndLine.number + 1);
              const delimiterRowText = delimiterLine.text;

              const parts = delimiterRowText.split('|').filter(p => p.trim() !== '');
              tableData.alignments = parts.map(part => {
                const trimmed = part.trim();
                if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
                if (trimmed.endsWith(':')) return 'right';
                if (trimmed.startsWith(':')) return 'left';
                return null;
              });
            }
          }

          // Process TableRows
          child = node.node.firstChild;
          while (child) {
            if (child.name === 'TableRow') {
              const row: string[] = [];
              let cellCursor = child.cursor();
              if (cellCursor.firstChild()) {
                do {
                  if (cellCursor.name === 'TableCell') {
                    row.push(state.sliceDoc(cellCursor.from, cellCursor.to));
                  }
                } while (cellCursor.nextSibling());
              }
              tableData.rows.push(row);
            }
            child = child.nextSibling;
          }
        }

        try {
          builder.add(node.from, node.to, Decoration.replace({
            widget: new TableWidget(tableData)
          }));
        } catch (e) {
          console.error('Failed to add table decoration:', e);
        }
        return false;
      }
      else if (node.name === 'InlineCode') {
        if (selection.from >= node.from && selection.to <= node.to) return;

        let c = node.node.cursor();
        c.firstChild();
        do {
          if (c.name === 'CodeMark') {
            builder.add(c.from, c.to, Decoration.replace({}));
          }
        } while (c.nextSibling());
      }
      else if (node.name === 'FencedCode') {
        const startLine = state.doc.lineAt(node.from);
        const endLine = state.doc.lineAt(node.to);

        const isFocused = selection.from >= node.from && selection.to <= node.to;

        if (isFocused) {
          for (let i = startLine.number; i <= endLine.number; i++) {
            const line = state.doc.line(i);
            let className = 'cm-codeblock-line';
            if (i === startLine.number) className += ' cm-codeblock-start';
            if (i === endLine.number) className += ' cm-codeblock-end';

            builder.add(line.from, line.from, Decoration.line({
              class: className
            }));
          }
        } else {
          for (let i = startLine.number; i <= endLine.number; i++) {
            const line = state.doc.line(i);

            if (i === startLine.number || i === endLine.number) {
              builder.add(line.from, line.from, Decoration.line({
                attributes: { style: 'display: none' }
              }));
            } else {
              let className = 'cm-codeblock-line';
              if (i === startLine.number + 1) className += ' cm-codeblock-start';
              if (i === endLine.number - 1) className += ' cm-codeblock-end';

              builder.add(line.from, line.from, Decoration.line({
                class: className
              }));
            }
          }
        }
      }
    }
  });

  return builder.finish();
}

export const hybridView = StateField.define<DecorationSet>({
  create(state) {
    return computeHybridDecorations(state);
  },
  update(decorations, tr) {
    if (tr.docChanged || tr.selection) {
      return computeHybridDecorations(tr.state);
    }
    return decorations;
  },
  provide: field => EditorView.decorations.from(field)
});
