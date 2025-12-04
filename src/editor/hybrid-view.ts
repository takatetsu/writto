import { RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';

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


// Table rendering disabled - causes performance issues

function computeHybridDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const { state } = view;
  const selection = state.selection.main;

  syntaxTree(state).iterate({
    from: view.viewport.from,
    to: view.viewport.to,
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
        const text = view.state.sliceDoc(node.from, node.to);
        if (['-', '*', '+'].includes(text)) {
          builder.add(node.from, node.to, Decoration.replace({
            widget: new BulletWidget()
          }));
        }
      }
      else if (node.name === 'Link') {
        if (selection.from >= node.from && selection.to <= node.to) return;

        const text = view.state.sliceDoc(node.from, node.to);
        const match = text.match(/^\[(.*?)\]\((.*?)\)/);
        if (match) {
          builder.add(node.from, node.to, Decoration.replace({
            widget: new LinkWidget(match[1], match[2])
          }));
        }
      }
      // Table rendering disabled - causes performance issues
      // else if (node.name === 'Table') {
      //   // Only render when not focused
      //   if (selection.from >= node.from && selection.to <= node.to) return;

      //   const text = view.state.sliceDoc(node.from, node.to);
      //   builder.add(node.from, node.to, Decoration.replace({
      //     widget: new TableWidget(text)
      //   }));
      // }
      else if (node.name === 'InlineCode') {
        // Check if cursor is inside or touching the inline code
        if (state.selection.ranges.some(r => r.from >= node.from && r.to <= node.to)) return;

        let c = node.node.cursor();
        c.firstChild();
        do {
          if (c.name === 'CodeMark') {
            builder.add(c.from, c.to, Decoration.replace({}));
          }
        } while (c.nextSibling());
      }
      else if (node.name === 'FencedCode') {
        const startLine = view.state.doc.lineAt(node.from);
        const endLine = view.state.doc.lineAt(node.to);

        // Check if any cursor is inside the code block
        const isFocused = state.selection.ranges.some(r => r.from >= node.from && r.to <= node.to);

        if (isFocused) {
          // Show everything normally
          for (let i = startLine.number; i <= endLine.number; i++) {
            const line = view.state.doc.line(i);
            let className = 'cm-codeblock-line';
            if (i === startLine.number) className += ' cm-codeblock-start';
            if (i === endLine.number) className += ' cm-codeblock-end';

            builder.add(line.from, line.from, Decoration.line({
              class: className
            }));
          }
        } else {
          // Hide delimiters
          for (let i = startLine.number; i <= endLine.number; i++) {
            const line = view.state.doc.line(i);

            if (i === startLine.number || i === endLine.number) {
              // Hide the first and last lines (delimiters)
              builder.add(line.from, line.from, Decoration.line({
                attributes: { style: 'display: none' }
              }));
            } else {
              // Show content lines
              let className = 'cm-codeblock-line';
              // Adjust rounded corners to the new visible first/last lines
              // The new first line is startLine.number + 1
              // The new last line is endLine.number - 1
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

export const hybridView = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = computeHybridDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = computeHybridDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
