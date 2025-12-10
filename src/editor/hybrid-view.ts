import { RangeSet, StateField, EditorState, Facet, Range } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { readFile } from '@tauri-apps/plugin-fs';
import { TableWidget, TableData } from './table-widget';

export const baseDirFacet = Facet.define<string, string>({
  combine: values => values[0] || ''
});

// Helper function to get MIME type from file extension
function getMimeType(path: string): string {
  const ext = path.toLowerCase().split('.').pop() || '';
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
  };
  return mimeTypes[ext] || 'image/jpeg';
}

// Import marked for markdown rendering inside details
import { marked } from 'marked';

// Widget for HTML <details> tag - renders collapsible sections
class DetailsWidget extends WidgetType {
  constructor(
    readonly summaryText: string,
    readonly contentText: string
  ) {
    super();
  }

  eq(other: DetailsWidget) {
    return other.summaryText === this.summaryText &&
      other.contentText === this.contentText;
  }

  toDOM() {
    const details = document.createElement('details');
    details.className = 'cm-details-widget';

    const summary = document.createElement('summary');
    summary.className = 'cm-details-summary';
    summary.textContent = this.summaryText;

    // Add hint text
    const hint = document.createElement('span');
    hint.className = 'cm-details-hint';
    hint.textContent = '（内部クリックで編集）';
    summary.appendChild(hint);

    details.appendChild(summary);

    const content = document.createElement('div');
    content.className = 'cm-details-content';

    // Use marked to render markdown content
    try {
      const htmlContent = marked.parse(this.contentText, { async: false }) as string;
      content.innerHTML = htmlContent;
    } catch (e) {
      // Fallback to plain text if marked fails
      content.textContent = this.contentText;
    }

    details.appendChild(content);
    return details;
  }

  // Only ignore clicks on the summary (for toggle), allow content clicks
  ignoreEvent(event: Event): boolean {
    const target = event.target as HTMLElement;

    // Check if click is on summary or its children (toggle area)
    if (target?.closest('.cm-details-summary')) {
      // Ignore click on summary - just toggle open/close
      if (event.type === 'mousedown' || event.type === 'click') {
        return true;
      }
    }

    // Allow clicks on content to trigger edit mode
    return false;
  }
}

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


class ImageWidget extends WidgetType {
  constructor(
    readonly url: string,
    readonly alt: string,
    readonly title: string | null,
    readonly baseDir: string
  ) {
    super();
  }

  eq(other: ImageWidget) {
    return other.url === this.url &&
      other.alt === this.alt &&
      other.title === this.title &&
      other.baseDir === this.baseDir;
  }

  toDOM() {
    const img = document.createElement('img');
    let src = this.url;

    let width = '';
    let height = '';

    if (this.title) {
      const sizeMatch = this.title.match(/^=(\d+)(?:x(\d+))?$/);
      if (sizeMatch) {
        width = sizeMatch[1];
        if (sizeMatch[2]) height = sizeMatch[2];
      }
    }

    const urlSizeMatch = this.url.match(/\s=(\d+)(?:x(\d+))?$/);
    if (urlSizeMatch) {
      src = this.url.substring(0, urlSizeMatch.index);
      width = urlSizeMatch[1];
      if (urlSizeMatch[2]) height = urlSizeMatch[2];
    }

    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
      img.src = src;
    } else {
      let absolutePath = src;
      const isAbsolute = src.startsWith('/') || src.match(/^[a-zA-Z]:/);

      if (!isAbsolute && this.baseDir) {
        const separator = this.baseDir.includes('\\') ? '\\' : '/';
        if (src.startsWith('./')) {
          absolutePath = `${this.baseDir}${separator}${src.substring(2)}`;
        } else {
          absolutePath = `${this.baseDir}${separator}${src}`;
        }
      }

      img.alt = this.alt + ' (読み込み中...)';
      this.loadLocalImage(absolutePath, img);
    }

    img.alt = this.alt;
    if (this.title && !width) img.title = this.title;

    if (width) img.style.width = `${width}px`;
    if (height) img.style.height = `${height}px`;

    img.style.maxWidth = '100%';

    return img;
  }

  private async loadLocalImage(path: string, img: HTMLImageElement) {
    try {
      const data = await readFile(path);
      const mimeType = getMimeType(path);
      const blob = new Blob([data], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      img.src = blobUrl;
      img.alt = this.alt;
    } catch (e) {
      console.error('[ImageWidget] Failed to load image:', path, e);
      img.alt = `${this.alt} (読み込みエラー)`;
    }
  }

  ignoreEvent() { return false; }
}

function computeHybridDecorations(state: EditorState): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const selection = state.selection.main;
  const baseDir = state.facet(baseDirFacet);

  syntaxTree(state).iterate({
    enter: (node) => {
      if (node.name === 'StrongEmphasis' || node.name === 'Emphasis') {
        if (selection.from >= node.from && selection.to <= node.to) return;

        let c = node.node.cursor();
        c.firstChild();
        do {
          if (c.name === 'EmphasisMark') {
            decorations.push(Decoration.replace({}).range(c.from, c.to));
          }
        } while (c.nextSibling());
      }
      else if (node.name.startsWith('ATXHeading')) {
        if (selection.from >= node.from && selection.to <= node.to) return;

        let c = node.node.cursor();
        c.firstChild();
        do {
          if (c.name === 'HeaderMark') {
            decorations.push(Decoration.replace({}).range(c.from, c.to));
          }
        } while (c.nextSibling());
      }
      else if (node.name === 'Blockquote') {
        // Skip decoration if cursor is inside this blockquote or any ancestor blockquote (edit mode)
        if (selection.from >= node.from && selection.to <= node.to) return;

        // Also check if any ancestor Blockquote contains the cursor
        let ancestorParent = node.node.parent;
        while (ancestorParent) {
          if (ancestorParent.name === 'Blockquote' && selection.from >= ancestorParent.from && selection.to <= ancestorParent.to) {
            return; // Edit mode - ancestor blockquote contains cursor
          }
          ancestorParent = ancestorParent.parent;
        }

        // Handle entire blockquote with line decorations for continuous bar
        // Count nesting level by counting parent Blockquotes
        let nestLevel = 1;
        let parent = node.node.parent;
        while (parent) {
          if (parent.name === 'Blockquote') nestLevel++;
          parent = parent.parent;
        }

        const startLine = state.doc.lineAt(node.from);
        const endLine = state.doc.lineAt(node.to);

        for (let i = startLine.number; i <= endLine.number; i++) {
          const line = state.doc.line(i);
          let className = `cm-blockquote-line cm-blockquote-level-${nestLevel}`;
          if (i === startLine.number) className += ' cm-blockquote-start';
          if (i === endLine.number) className += ' cm-blockquote-end';

          decorations.push(Decoration.line({
            class: className
          }).range(line.from));
        }
      }
      else if (node.name === 'QuoteMark') {
        // Check if cursor is inside any ancestor Blockquote (edit mode for entire block including nested)
        let parent = node.node.parent;
        while (parent) {
          if (parent.name === 'Blockquote' && selection.from >= parent.from && selection.to <= parent.to) {
            return; // Edit mode for entire blockquote hierarchy
          }
          parent = parent.parent;
        }

        // Hide the > mark
        decorations.push(Decoration.replace({}).range(node.from, node.to));
      }
      else if (node.name === 'ListMark') {
        const text = state.sliceDoc(node.from, node.to);
        if (['-', '*', '+'].includes(text)) {
          decorations.push(Decoration.replace({
            widget: new BulletWidget()
          }).range(node.from, node.to));
        }
      }
      else if (node.name === 'Image') {
        if (selection.from >= node.from && selection.to <= node.to) return;

        const text = state.sliceDoc(node.from, node.to);
        const match = text.match(/^!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/);
        if (match) {
          decorations.push(Decoration.replace({
            widget: new ImageWidget(match[2], match[1], match[3] || null, baseDir)
          }).range(node.from, node.to));
          return false;
        }
      }
      else if (node.name === 'Link') {
        if (selection.from >= node.from && selection.to <= node.to) return;

        const text = state.sliceDoc(node.from, node.to);
        const match = text.match(/^\[(.*?)\]\((.*?)\)/);
        if (match) {
          decorations.push(Decoration.replace({
            widget: new LinkWidget(match[1], match[2])
          }).range(node.from, node.to));
          return false;
        }
      }
      else if (node.name === 'Table') {
        if (selection.from >= node.from && selection.to <= node.to) return;
        if (node.to <= node.from) return;

        const tableData: TableData = {
          headers: [],
          rows: [],
          alignments: []
        };

        let cursor = node.node.cursor();
        if (cursor.firstChild()) {
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
          decorations.push(Decoration.replace({
            widget: new TableWidget(tableData)
          }).range(node.from, node.to));
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
            decorations.push(Decoration.replace({}).range(c.from, c.to));
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

            decorations.push(Decoration.line({
              class: className
            }).range(line.from));
          }
        } else {
          for (let i = startLine.number; i <= endLine.number; i++) {
            const line = state.doc.line(i);

            if (i === startLine.number || i === endLine.number) {
              decorations.push(Decoration.line({
                attributes: { style: 'display: none' }
              }).range(line.from));
            } else {
              let className = 'cm-codeblock-line';
              if (i === startLine.number + 1) className += ' cm-codeblock-start';
              if (i === endLine.number - 1) className += ' cm-codeblock-end';

              decorations.push(Decoration.line({
                class: className
              }).range(line.from));
            }
          }
        }
      }
    }
  });

  // Detect and render HTML <details> tags (not part of markdown syntax tree)
  const docText = state.doc.toString();
  const detailsRegex = /<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g;
  let match;

  while ((match = detailsRegex.exec(docText)) !== null) {
    const from = match.index;
    const to = from + match[0].length;

    // Skip if cursor is inside this details block (edit mode)
    if (selection.from >= from && selection.to <= to) continue;

    const summaryText = match[1].trim();
    const contentText = match[2].trim();

    decorations.push(Decoration.replace({
      widget: new DetailsWidget(summaryText, contentText)
    }).range(from, to));
  }

  // Sort decorations by from position and return as RangeSet
  return RangeSet.of(decorations, true);
}

export const hybridView = StateField.define<DecorationSet>({
  create(state) {
    return computeHybridDecorations(state);
  },
  update(decorations, tr) {
    if (tr.docChanged || tr.selection || tr.state.facet(baseDirFacet) !== tr.startState.facet(baseDirFacet)) {
      return computeHybridDecorations(tr.state);
    }
    return decorations;
  },
  provide: field => EditorView.decorations.from(field)
});
