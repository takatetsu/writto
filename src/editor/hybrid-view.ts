import { RangeSet, StateField, EditorState, Facet, Range, StateEffect, Prec } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
  keymap
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { readFile } from '@tauri-apps/plugin-fs';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import { TableWidget, TableData } from './table-widget';
import { getInitialLanguage, translations } from '../lib/i18n';
import mermaid from 'mermaid';

// Initialize mermaid with default settings
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

export const baseDirFacet = Facet.define<string, string>({
  combine: values => values[0] || ''
});

// Edit mode state management
// Stores the line number that is currently in edit mode, or null if in view mode
const setEditModeLine = StateEffect.define<number | null>();

const editModeState = StateField.define<number | null>({
  create: () => null,
  update(value, tr) {
    // Check for explicit edit mode change effects
    for (const effect of tr.effects) {
      if (effect.is(setEditModeLine)) {
        return effect.value;
      }
    }
    // If in edit mode and selection changed, update to follow cursor
    if (value !== null && tr.selection) {
      const cursorLine = tr.state.doc.lineAt(tr.state.selection.main.head).number;
      return cursorLine;
    }
    // If document changed and we're in edit mode, stay in edit mode on the same line
    // If cursor moved to a different line via click, the click handler will update this
    return value;
  }
});

// Helper to check if a position is in edit mode
// If the edit line is inside a block element (like Table), the entire block is considered in edit mode
function isInEditMode(state: EditorState, from: number, to: number): boolean {
  const editLine = state.field(editModeState);
  if (editLine === null) return false;

  const nodeStartLine = state.doc.lineAt(from).number;
  const nodeEndLine = state.doc.lineAt(to).number;

  // First, check if the node directly contains the edit line
  if (editLine >= nodeStartLine && editLine <= nodeEndLine) {
    return true;
  }

  // Next, check if the edit line is inside a block element (Table, FencedCode, etc.)
  // and if the node is also inside that same block
  const editLinePos = state.doc.line(editLine).from;

  // Find if edit line is inside a block element
  let blockFrom = -1;
  let blockTo = -1;

  syntaxTree(state).iterate({
    enter: (node) => {
      if (node.name === 'Table' || node.name === 'FencedCode' || node.name === 'CodeBlock') {
        if (editLinePos >= node.from && editLinePos <= node.to) {
          blockFrom = node.from;
          blockTo = node.to;
        }
      }
    }
  });

  // If edit line is inside a block, check if the current node overlaps with that block
  if (blockFrom >= 0 && blockTo >= 0) {
    // Check if the node (from, to) is within the block range
    if (from >= blockFrom && to <= blockTo) {
      return true;
    }
  }

  return false;
}

// Double-click handler to enter edit mode
const editModeClickHandler = EditorView.domEventHandlers({
  dblclick: (event, view) => {
    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos !== null) {
      const line = view.state.doc.lineAt(pos).number;
      view.dispatch({
        effects: setEditModeLine.of(line)
      });
    }
    return false; // Let default behavior (word selection) still happen
  },
  mousedown: (event, view) => {
    // Single click: if clicking on a different line, move edit mode to that line
    // But only if we're already in edit mode somewhere
    if (event.detail === 1) { // single click
      const currentEditLine = view.state.field(editModeState);
      if (currentEditLine !== null) {
        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos !== null) {
          const clickedLine = view.state.doc.lineAt(pos).number;
          if (clickedLine !== currentEditLine) {
            // Move edit mode to the clicked line
            view.dispatch({
              effects: setEditModeLine.of(clickedLine)
            });
          }
        }
      }
    }
    return false;
  }
});

// Enter key handler to enter edit mode, Escape to exit
// Use Prec.high to ensure this runs before the default Enter key handler
const editModeKeymap = Prec.high(keymap.of([
  {
    key: "Enter",
    run: (view) => {
      const currentEditLine = view.state.field(editModeState);
      const cursorLine = view.state.doc.lineAt(view.state.selection.main.head).number;

      // If not in edit mode, enter edit mode on current line
      if (currentEditLine === null) {
        view.dispatch({
          effects: setEditModeLine.of(cursorLine)
        });
        return true; // Consume the event
      }

      // If in edit mode, allow normal Enter (newline) and update edit mode to follow cursor
      // We need to let the default handler run first, then update the edit mode line
      setTimeout(() => {
        const newCursorLine = view.state.doc.lineAt(view.state.selection.main.head).number;
        view.dispatch({
          effects: setEditModeLine.of(newCursorLine)
        });
      }, 0);
      return false; // Let the default newline behavior happen
    }
  },
  {
    key: "Escape",
    run: (view) => {
      const currentEditLine = view.state.field(editModeState);
      if (currentEditLine !== null) {
        view.dispatch({
          effects: setEditModeLine.of(null)
        });
        return true; // Consume the event
      }
      return false;
    }
  }
]));

// Handler to auto-enter edit mode on any printable character input
const autoEditModeOnInput = EditorView.domEventHandlers({
  keydown: (event, view) => {
    // Skip if already in edit mode
    const currentEditLine = view.state.field(editModeState);
    if (currentEditLine !== null) return false;

    // Skip modifier keys and special keys
    if (event.ctrlKey || event.metaKey || event.altKey) return false;

    // Skip non-printable keys
    const nonPrintableKeys = [
      'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab',
      'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'Home', 'End', 'PageUp', 'PageDown', 'Insert', 'Delete',
      'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
      'PrintScreen', 'ScrollLock', 'Pause', 'NumLock', 'ContextMenu'
    ];
    if (nonPrintableKeys.includes(event.key)) return false;

    // Enter edit mode on current cursor line
    const cursorLine = view.state.doc.lineAt(view.state.selection.main.head).number;
    view.dispatch({
      effects: setEditModeLine.of(cursorLine)
    });

    // Let the key event proceed normally
    return false;
  }
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

// List of allowed HTML tags for rendering
const ALLOWED_TAGS = new Set([
  // Inline elements
  'b', 'strong', 'i', 'em', 'u', 's', 'del', 'ins', 'mark', 'code', 'sub', 'sup', 'br', 'span', 'small', 'big',
  // Block elements
  'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'hr', 'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  // Table elements
  'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'caption', 'colgroup', 'col',
  // Media elements
  'img', 'a', 'figure', 'figcaption',
  // Other safe elements
  'abbr', 'cite', 'dfn', 'kbd', 'q', 'samp', 'var', 'time', 'address', 'article', 'aside', 'footer', 'header', 'main', 'nav', 'section',
]);

// List of allowed attributes
const ALLOWED_ATTRS = new Set([
  'style', 'class', 'id', 'title', 'alt', 'src', 'href', 'target', 'width', 'height',
  'colspan', 'rowspan', 'align', 'valign', 'border', 'cellpadding', 'cellspacing',
  'rel', 'name', 'datetime', 'lang', 'dir',
]);

// Sanitize HTML to remove dangerous elements and attributes
function sanitizeHTML(html: string): string {
  // Create a temporary element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Function to recursively sanitize elements
  function sanitizeElement(element: Element): void {
    // Get all child elements (convert to array to avoid mutation issues)
    const children = Array.from(element.children);

    for (const child of children) {
      const tagName = child.tagName.toLowerCase();

      // Remove disallowed tags completely
      if (!ALLOWED_TAGS.has(tagName)) {
        // For script, style, iframe etc., remove entirely
        if (['script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'form', 'input', 'button', 'select', 'textarea', 'link', 'meta', 'base'].includes(tagName)) {
          child.remove();
          continue;
        }
        // For other unknown tags, replace with contents
        const fragment = document.createDocumentFragment();
        while (child.firstChild) {
          fragment.appendChild(child.firstChild);
        }
        child.replaceWith(fragment);
        continue;
      }

      // Remove disallowed attributes
      const attrs = Array.from(child.attributes);
      for (const attr of attrs) {
        const attrName = attr.name.toLowerCase();

        // Remove event handlers (on*)
        if (attrName.startsWith('on')) {
          child.removeAttribute(attr.name);
          continue;
        }

        // Remove javascript: URLs
        if ((attrName === 'href' || attrName === 'src') && attr.value.toLowerCase().trim().startsWith('javascript:')) {
          child.removeAttribute(attr.name);
          continue;
        }

        // Remove data: URLs for security (except for images)
        if (attrName === 'src' && attr.value.toLowerCase().trim().startsWith('data:') && tagName !== 'img') {
          child.removeAttribute(attr.name);
          continue;
        }

        // Remove disallowed attributes
        if (!ALLOWED_ATTRS.has(attrName) && !attrName.startsWith('data-')) {
          child.removeAttribute(attr.name);
        }
      }

      // Recursively sanitize children
      sanitizeElement(child);
    }
  }

  sanitizeElement(tempDiv);
  return tempDiv.innerHTML;
}

// Widget for rendering HTML content
class HTMLWidget extends WidgetType {
  constructor(readonly htmlContent: string) {
    super();
  }

  eq(other: HTMLWidget) {
    return other.htmlContent === this.htmlContent;
  }

  toDOM() {
    const container = document.createElement('div');
    container.className = 'cm-html-widget';

    // Sanitize and render HTML
    let sanitizedHTML = sanitizeHTML(this.htmlContent);

    // Remove whitespace between tags to prevent extra spacing in lists
    // This removes newlines, spaces, and tabs between > and <
    sanitizedHTML = sanitizedHTML.replace(/>\s+</g, '><');

    container.innerHTML = sanitizedHTML;

    // Handle links - make them open in external browser with Ctrl+click
    const links = container.querySelectorAll('a[href]');
    links.forEach((link) => {
      const anchor = link as HTMLAnchorElement;
      const href = anchor.getAttribute('href') || '';

      anchor.addEventListener('click', async (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          if (href && !href.startsWith('#')) {
            try {
              await shellOpen(href);
            } catch (err) {
              console.error('[HTMLWidget] Failed to open URL:', err);
            }
          }
        }
      });

      // Show hint on hover
      const isJapanese = navigator.language.startsWith('ja') || localStorage.getItem('language') === 'ja';
      anchor.title = isJapanese ? 'Ctrl+クリックでリンク先へ移動' : 'Ctrl+Click to follow link';
    });

    // Handle images with local paths
    const images = container.querySelectorAll('img[src]');
    images.forEach((img) => {
      const imgElement = img as HTMLImageElement;
      const src = imgElement.getAttribute('src') || '';

      // If it's a local path, try to load it
      if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:')) {
        this.loadLocalImage(src, imgElement);
      }

      // Add max-width to prevent overflow
      imgElement.style.maxWidth = '100%';
    });

    return container;
  }

  private async loadLocalImage(path: string, img: HTMLImageElement) {
    try {
      const data = await readFile(path);
      const mimeType = getMimeType(path);
      const blob = new Blob([data], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      img.src = blobUrl;
    } catch (e) {
      console.error('[HTMLWidget] Failed to load image:', path, e);
      img.alt = `${img.alt || 'Image'} (読み込みエラー)`;
    }
  }

  // Allow clicks on content to trigger edit mode
  ignoreEvent(event: Event): boolean {
    // Ignore Ctrl+click on links
    if (event instanceof MouseEvent && (event.ctrlKey || event.metaKey)) {
      const target = event.target as HTMLElement;
      if (target.tagName === 'A' || target.closest('a')) {
        return true;
      }
    }
    return false;
  }
}

// More comprehensive function to find HTML content (multi-line)
// Handles nested tags properly by finding the matching closing tag
function findHTMLBlocks(text: string): { from: number; to: number; content: string }[] {
  const blocks: { from: number; to: number; content: string }[] = [];

  // Tags that typically contain block content
  const blockTags = ['div', 'p', 'table', 'ul', 'ol', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'dl', 'figure', 'article', 'aside', 'section', 'header', 'footer', 'main', 'nav', 'address'];

  // Find opening tags and their matching closing tags
  for (const tag of blockTags) {
    const openTagRegex = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
    let openMatch;

    while ((openMatch = openTagRegex.exec(text)) !== null) {
      const startPos = openMatch.index;

      // Find the matching closing tag by counting nested tags
      let depth = 1;
      let pos = startPos + openMatch[0].length;
      const closeTagRegex = new RegExp(`<(/?)(${tag})\\b[^>]*>`, 'gi');
      closeTagRegex.lastIndex = pos;

      let closeMatch;
      while ((closeMatch = closeTagRegex.exec(text)) !== null) {
        if (closeMatch[1] === '/') {
          // Closing tag
          depth--;
          if (depth === 0) {
            const endPos = closeMatch.index + closeMatch[0].length;
            const content = text.substring(startPos, endPos);

            // Check if this block overlaps with any existing block
            const overlaps = blocks.some(b =>
              (startPos >= b.from && startPos < b.to) ||
              (endPos > b.from && endPos <= b.to) ||
              (startPos <= b.from && endPos >= b.to)
            );

            if (!overlaps) {
              blocks.push({
                from: startPos,
                to: endPos,
                content: content
              });
            }
            break;
          }
        } else {
          // Opening tag of same type
          depth++;
        }
      }
    }
  }

  // Also find self-closing tags like <hr />, <br />, and <img ... />
  const selfClosingRegex = /<(hr|br|img)\b[^>]*\/?>/gi;
  let match;
  while ((match = selfClosingRegex.exec(text)) !== null) {
    // Check if this position overlaps with any existing block
    const overlaps = blocks.some(b => match!.index >= b.from && match!.index < b.to);
    if (!overlaps) {
      blocks.push({
        from: match.index,
        to: match.index + match[0].length,
        content: match[0]
      });
    }
  }

  // Sort by position
  blocks.sort((a, b) => a.from - b.from);

  return blocks;
}

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

// Widget for Mermaid diagrams
class MermaidWidget extends WidgetType {
  private static counter = 0;

  constructor(readonly code: string) {
    super();
  }

  eq(other: MermaidWidget) {
    return other.code === this.code;
  }

  toDOM() {
    const container = document.createElement('div');
    container.className = 'cm-mermaid-widget';

    // Create a unique ID for this diagram
    const id = `mermaid-${MermaidWidget.counter++}-${Date.now()}`;

    // Render the mermaid diagram asynchronously
    this.renderMermaid(container, id);

    return container;
  }

  private async renderMermaid(container: HTMLElement, id: string) {
    try {
      // Check if we're in dark mode by looking at the dark-mode class on app-container
      const appContainer = document.querySelector('.app-container');
      const isDarkMode = appContainer?.classList.contains('dark-mode') ?? false;

      // Reinitialize mermaid with the appropriate theme
      // Use 'base' theme for dark mode to have full control via themeVariables
      mermaid.initialize({
        startOnLoad: false,
        theme: isDarkMode ? 'base' : 'default',
        securityLevel: 'loose',
        themeVariables: isDarkMode ? {
          // Dark mode theme variables - comprehensive settings
          // Use 'base' theme and fully customize colors

          // Background colors
          background: '#2d2d2d',
          darkMode: true,

          // Primary colors - used for main nodes
          primaryColor: '#3a5a7a',
          primaryTextColor: '#ffffff',
          primaryBorderColor: '#7a9aba',

          // Secondary colors
          secondaryColor: '#4a6a8a',
          secondaryTextColor: '#ffffff',
          secondaryBorderColor: '#8aaaba',

          // Tertiary colors
          tertiaryColor: '#3a4a5a',
          tertiaryTextColor: '#ffffff',
          tertiaryBorderColor: '#6a7a8a',

          // General text and lines
          lineColor: '#aaaaaa',
          textColor: '#ffffff',
          mainBkg: '#3a5a7a',
          nodeBorder: '#7a9aba',
          nodeTextColor: '#ffffff',

          // Flowchart
          nodeBkg: '#3a5a7a',
          clusterBkg: '#2d3d4d',
          clusterBorder: '#5a6a7a',
          defaultLinkColor: '#aaaaaa',
          titleColor: '#ffffff',
          edgeLabelBackground: '#2d2d2d',

          // Class diagram
          classText: '#ffffff',

          // Sequence diagram
          actorBkg: '#3a5a7a',
          actorBorder: '#7a9aba',
          actorTextColor: '#ffffff',
          actorLineColor: '#888888',
          signalColor: '#aaaaaa',
          signalTextColor: '#ffffff',
          labelBoxBkgColor: '#3a5a7a',
          labelBoxBorderColor: '#7a9aba',
          labelTextColor: '#ffffff',
          loopTextColor: '#ffffff',
          noteBkgColor: '#4a6a8a',
          noteBorderColor: '#8aaaba',
          noteTextColor: '#ffffff',
          activationBkgColor: '#4a6a8a',
          activationBorderColor: '#8aaaba',

          // State diagram - key settings
          labelColor: '#ffffff',
          altBackground: '#3a5a7a',
          compositeBackground: '#3a5a7a',
          compositeBorder: '#7a9aba',
          compositeTitleBackground: '#4a6a8a',

          // ER diagram
          attributeBackgroundColorOdd: '#3a5a7a',
          attributeBackgroundColorEven: '#4a6a8a',

          // Pie chart - use vibrant, distinguishable colors
          pie1: '#5b9bd5',  // Blue
          pie2: '#ed7d31',  // Orange
          pie3: '#70ad47',  // Green
          pie4: '#ffc000',  // Yellow
          pie5: '#9e480e',  // Brown
          pie6: '#7030a0',  // Purple
          pie7: '#44546a',  // Dark blue-gray
          pie8: '#ff6b6b',  // Red
          pie9: '#4ecdc4',  // Teal
          pie10: '#95a5a6', // Gray
          pie11: '#e74c3c', // Bright red
          pie12: '#3498db', // Bright blue
          pieStrokeColor: '#1e1e1e',
          pieStrokeWidth: '2px',
          pieLegendTextColor: '#ffffff',
          pieTitleTextColor: '#ffffff',
          pieOpacity: '1',
          pieSectionTextColor: '#ffffff',

          // Additional important settings
          fontSize: '16px',
          fontFamily: 'sans-serif',

          // Critical for text visibility
          cScale0: '#3a5a7a',
          cScale1: '#4a6a8a',
          cScale2: '#5a7a9a',
          cScale3: '#6a8aaa',
          cScale4: '#7a9aba',
          cScale5: '#8aaaca',
          cScaleLabel0: '#ffffff',
          cScaleLabel1: '#ffffff',
          cScaleLabel2: '#ffffff',
          cScaleLabel3: '#ffffff',
          cScaleLabel4: '#ffffff',
          cScaleLabel5: '#ffffff',
        } : {},
      });

      const { svg } = await mermaid.render(id, this.code);
      container.innerHTML = svg;
      container.classList.add('cm-mermaid-rendered');

      // For dark mode, directly modify SVG styles after rendering
      if (isDarkMode) {
        container.classList.add('cm-mermaid-dark');
        this.applyDarkModeStyles(container);
      }
    } catch (e) {
      console.error('Mermaid rendering error:', e);
      container.innerHTML = `<div class="cm-mermaid-error">Mermaid構文エラー: ${e instanceof Error ? e.message : 'Unknown error'}</div>`;
      container.classList.add('cm-mermaid-error-container');
    }
  }

  // Apply dark mode styles directly to SVG elements
  private applyDarkModeStyles(container: HTMLElement) {
    const svgElement = container.querySelector('svg');
    if (!svgElement) return;

    // Dark colors for backgrounds and borders
    const darkBgColor = '#3a5a7a';
    const darkBgColor2 = '#4a6a8a';
    const borderColor = '#7a9aba';
    const textColor = '#ffffff';
    const lineColor = '#cccccc';

    // Detect diagram type by looking for specific classes or elements
    const pieElements = svgElement.querySelectorAll('.pieTitleText, .pieCircle, .slice, [class*="pie"], [class*="slice"]');
    const isPieChart = pieElements.length > 0;

    // For pie charts, sync legend rect colors with slice colors
    if (isPieChart) {
      const pieSlices = svgElement.querySelectorAll('.pieCircle');

      // Get slice colors
      const sliceColors: string[] = [];
      pieSlices.forEach(slice => {
        const fill = slice.getAttribute('fill');
        if (fill) sliceColors.push(fill);
      });

      // Get ALL rects in the SVG - the small ones (18x18) are legend color boxes
      const allRects = svgElement.querySelectorAll('rect');

      // Apply colors to all rects that are likely legend boxes (small size)
      let legendRectIndex = 0;
      allRects.forEach((rect) => {
        const width = rect.getAttribute('width');
        const height = rect.getAttribute('height');

        // Legend rects are typically small (18x18 or similar)
        if (width === '18' && height === '18' && legendRectIndex < sliceColors.length) {
          rect.setAttribute('fill', sliceColors[legendRectIndex]);
          (rect as unknown as HTMLElement).style.setProperty('fill', sliceColors[legendRectIndex], 'important');
          legendRectIndex++;
        }
      });
    }

    // Force all rect elements to have dark background (skip pie chart legend rects)
    if (!isPieChart) {
      const rects = svgElement.querySelectorAll('rect');
      rects.forEach((rect, index) => {
        const currentFill = rect.getAttribute('fill') || '';
        const currentClass = rect.getAttribute('class') || '';

        // Skip only truly transparent rects
        if (currentFill === 'none' || currentFill === 'transparent') return;

        // Skip the main SVG background rect (usually the first one with no class)
        if (index === 0 && !currentClass) return;

        rect.setAttribute('fill', darkBgColor);
        rect.setAttribute('stroke', borderColor);
        rect.style.fill = darkBgColor;
        rect.style.stroke = borderColor;
      });
    }

    // Force all text elements to be white
    const texts = svgElement.querySelectorAll('text');
    texts.forEach(text => {
      text.setAttribute('fill', textColor);
      text.style.fill = textColor;
      text.style.color = textColor;
    });

    // Force all tspan elements to be white
    const tspans = svgElement.querySelectorAll('tspan');
    tspans.forEach(tspan => {
      tspan.setAttribute('fill', textColor);
      (tspan as unknown as HTMLElement).style.fill = textColor;
    });

    // Force all path elements (lines, arrows) to be visible
    // BUT preserve pie chart slice colors completely
    if (!isPieChart) {
      const paths = svgElement.querySelectorAll('path');
      paths.forEach(path => {
        const currentStroke = path.getAttribute('stroke') || '';
        const currentFill = path.getAttribute('fill') || '';

        // Change stroke if it exists (for lines, arrows)
        if (currentStroke && currentStroke !== 'none' && currentStroke !== 'transparent') {
          path.setAttribute('stroke', lineColor);
        }
        // Also handle filled paths (like arrowheads) - but only in markers
        if (currentFill && currentFill !== 'none' && currentFill !== 'transparent') {
          const isInMarker = path.closest('marker') !== null;
          if (isInMarker) {
            path.setAttribute('fill', lineColor);
          }
        }
      });
    } else {
      // For pie charts, only style marker paths, leave slices alone
      const markerPaths = svgElement.querySelectorAll('marker path');
      markerPaths.forEach(path => {
        path.setAttribute('fill', lineColor);
        path.setAttribute('stroke', lineColor);
      });
    }

    // Force all line elements to be visible
    const lines = svgElement.querySelectorAll('line');
    lines.forEach(line => {
      line.setAttribute('stroke', borderColor);
    });

    // Force polygons (arrowheads, shapes) to be visible
    // Note: Some diagrams use polygons for nodes
    const polygons = svgElement.querySelectorAll('polygon');
    polygons.forEach(polygon => {
      // State diagram nodes and similar
      polygon.setAttribute('fill', darkBgColor);
      polygon.setAttribute('stroke', borderColor);
      polygon.style.fill = darkBgColor;
      polygon.style.stroke = borderColor;
    });

    // Force ellipses and circles - these are often state diagram nodes
    const ellipses = svgElement.querySelectorAll('ellipse, circle');
    ellipses.forEach(el => {
      const currentFill = el.getAttribute('fill') || '';

      // Skip truly transparent or the pie chart outer circle
      if (currentFill === 'none' || currentFill === 'transparent') return;

      // Make state diagram nodes dark
      el.setAttribute('fill', darkBgColor2);
      el.setAttribute('stroke', borderColor);
    });

    // Force marker elements (arrowheads)
    const markers = svgElement.querySelectorAll('marker');
    markers.forEach(marker => {
      const markerPaths = marker.querySelectorAll('path');
      markerPaths.forEach(path => {
        path.setAttribute('fill', lineColor);
        path.setAttribute('stroke', lineColor);
      });
    });

    // Handle foreignObject elements (used for labels with HTML)
    const foreignObjects = svgElement.querySelectorAll('foreignObject');
    foreignObjects.forEach(fo => {
      const elements = fo.querySelectorAll('*');
      elements.forEach(el => {
        (el as HTMLElement).style.color = textColor;
        (el as HTMLElement).style.backgroundColor = 'transparent';
      });
    });

    // Handle g (group) elements with specific classes - for state diagrams
    const stateGroups = svgElement.querySelectorAll('.stateGroup, .statediagram-state, .state-group');
    stateGroups.forEach(group => {
      // Find and style the background elements in state groups
      const groupRects = group.querySelectorAll('rect');
      groupRects.forEach(rect => {
        rect.setAttribute('fill', darkBgColor);
        rect.setAttribute('stroke', borderColor);
        rect.style.fill = darkBgColor;
        rect.style.stroke = borderColor;
      });
      const groupPaths = group.querySelectorAll('path');
      groupPaths.forEach(path => {
        const currentFill = path.getAttribute('fill') || '';
        if (currentFill && currentFill !== 'none' && currentFill !== 'transparent') {
          path.setAttribute('fill', darkBgColor);
          path.setAttribute('stroke', borderColor);
        }
      });
    });

    // Handle label groups
    const labelGroups = svgElement.querySelectorAll('g');
    labelGroups.forEach(g => {
      const className = g.getAttribute('class') || '';
      if (className.includes('label') || className.includes('text')) {
        const textEls = g.querySelectorAll('text, tspan');
        textEls.forEach(el => {
          el.setAttribute('fill', textColor);
        });
      }
    });
  }

  ignoreEvent() { return false; }
}

// Widget for code blocks (non-mermaid)
class CodeBlockWidget extends WidgetType {
  constructor(readonly code: string, readonly language: string) {
    super();
  }

  eq(other: CodeBlockWidget) {
    return other.code === this.code && other.language === this.language;
  }

  toDOM() {
    const container = document.createElement('div');
    container.className = 'cm-codeblock-widget';

    // Header with language label and copy button
    const header = document.createElement('div');
    header.className = 'cm-codeblock-header';

    // Language label
    if (this.language) {
      const langLabel = document.createElement('span');
      langLabel.className = 'cm-codeblock-lang';
      langLabel.textContent = this.language;
      header.appendChild(langLabel);
    }

    // Copy button with i18n support
    const lang = getInitialLanguage();
    const copyText = translations[lang]['codeblock.copy'];
    const copiedText = translations[lang]['codeblock.copied'];
    const tooltipText = translations[lang]['codeblock.copyTooltip'];
    const errorText = translations[lang]['codeblock.error'];

    const copyBtn = document.createElement('button');
    copyBtn.className = 'cm-codeblock-copy-btn';
    copyBtn.textContent = copyText;
    copyBtn.title = tooltipText;

    const codeText = this.code;
    copyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(codeText);
        copyBtn.textContent = copiedText;
        copyBtn.classList.add('cm-codeblock-copy-success');
        setTimeout(() => {
          copyBtn.textContent = copyText;
          copyBtn.classList.remove('cm-codeblock-copy-success');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
        copyBtn.textContent = errorText;
        setTimeout(() => {
          copyBtn.textContent = copyText;
        }, 2000);
      }
    });
    header.appendChild(copyBtn);
    container.appendChild(header);

    const pre = document.createElement('pre');
    pre.className = 'cm-codeblock-line cm-codeblock-start cm-codeblock-end';

    const code = document.createElement('code');
    if (this.language) {
      code.className = `language-${this.language}`;
    }

    // Apply syntax highlighting using highlightjs-style classes
    code.innerHTML = this.highlightCode(this.code, this.language);

    pre.appendChild(code);
    container.appendChild(pre);

    return container;
  }

  private highlightCode(code: string, language: string): string {
    // Simple syntax highlighting using regex patterns
    // Escape HTML first
    let escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    if (!language) {
      return escaped;
    }

    // Apply syntax highlighting based on language
    const langLower = language.toLowerCase();

    // Common patterns for various languages
    const patterns: { regex: RegExp, class: string }[] = [];

    // Comments (single line)
    if (['javascript', 'js', 'typescript', 'ts', 'java', 'c', 'cpp', 'csharp', 'cs', 'go', 'rust', 'swift', 'kotlin'].includes(langLower)) {
      patterns.push({ regex: /(\/\/.*?)$/gm, class: 'cm-syntax-comment' });
    }
    if (['python', 'ruby', 'bash', 'sh', 'shell', 'yaml', 'yml'].includes(langLower)) {
      patterns.push({ regex: /(#.*?)$/gm, class: 'cm-syntax-comment' });
    }

    // Strings
    patterns.push({ regex: /("(?:[^"\\]|\\.)*")/g, class: 'cm-syntax-string' });
    patterns.push({ regex: /('(?:[^'\\]|\\.)*')/g, class: 'cm-syntax-string' });
    patterns.push({ regex: /(`(?:[^`\\]|\\.)*`)/g, class: 'cm-syntax-string' });

    // Numbers
    patterns.push({ regex: /\b(\d+\.?\d*)\b/g, class: 'cm-syntax-number' });

    // Keywords based on language
    let keywords: string[] = [];
    if (['javascript', 'js', 'typescript', 'ts'].includes(langLower)) {
      keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'extends', 'import', 'export', 'from', 'default', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'super', 'static', 'public', 'private', 'protected', 'interface', 'type', 'enum', 'implements', 'readonly', 'abstract'];
    } else if (['python'].includes(langLower)) {
      keywords = ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'lambda', 'yield', 'global', 'nonlocal', 'pass', 'break', 'continue', 'and', 'or', 'not', 'in', 'is', 'None', 'True', 'False', 'async', 'await'];
    } else if (['java', 'kotlin'].includes(langLower)) {
      keywords = ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'static', 'final', 'void', 'int', 'long', 'double', 'float', 'boolean', 'char', 'byte', 'short', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'super', 'try', 'catch', 'finally', 'throw', 'throws', 'import', 'package'];
    } else if (['rust'].includes(langLower)) {
      keywords = ['fn', 'let', 'mut', 'const', 'static', 'struct', 'enum', 'impl', 'trait', 'pub', 'mod', 'use', 'return', 'if', 'else', 'for', 'while', 'loop', 'match', 'self', 'Self', 'super', 'crate', 'async', 'await', 'move', 'ref', 'where', 'type', 'dyn', 'unsafe'];
    } else if (['go'].includes(langLower)) {
      keywords = ['func', 'var', 'const', 'type', 'struct', 'interface', 'package', 'import', 'return', 'if', 'else', 'for', 'range', 'switch', 'case', 'default', 'break', 'continue', 'go', 'defer', 'select', 'chan', 'map', 'make', 'new', 'nil', 'true', 'false'];
    } else if (['c', 'cpp', 'csharp', 'cs'].includes(langLower)) {
      keywords = ['int', 'long', 'double', 'float', 'char', 'void', 'bool', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'struct', 'class', 'public', 'private', 'protected', 'static', 'const', 'extern', 'include', 'define', 'typedef', 'namespace', 'using', 'new', 'delete', 'this', 'virtual', 'override', 'template', 'typename'];
    } else if (['bash', 'sh', 'shell'].includes(langLower)) {
      keywords = ['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'function', 'return', 'exit', 'export', 'local', 'readonly', 'shift', 'set', 'unset', 'source', 'alias', 'echo', 'cd', 'pwd', 'ls', 'cp', 'mv', 'rm', 'mkdir', 'chmod', 'chown', 'grep', 'sed', 'awk', 'cat', 'head', 'tail'];
    } else if (['sql'].includes(langLower)) {
      keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'ORDER', 'BY', 'ASC', 'DESC', 'GROUP', 'HAVING', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AS', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'INDEX', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'NULL', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'LIMIT', 'OFFSET', 'UNION'];
    } else if (['html', 'xml'].includes(langLower)) {
      keywords = [];
      // Special handling for HTML tags
      escaped = escaped.replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="cm-syntax-keyword">$2</span>');
      escaped = escaped.replace(/([\w-]+)(=)/g, '<span class="cm-syntax-function">$1</span>$2');
    } else if (['css', 'scss', 'sass', 'less'].includes(langLower)) {
      keywords = [];
      // Properties
      escaped = escaped.replace(/([\w-]+)(\s*:)/g, '<span class="cm-syntax-function">$1</span>$2');
    } else if (['json'].includes(langLower)) {
      keywords = ['true', 'false', 'null'];
    } else if (['yaml', 'yml'].includes(langLower)) {
      keywords = ['true', 'false', 'null', 'yes', 'no'];
      // Keys
      escaped = escaped.replace(/^(\s*)([\w-]+)(:)/gm, '$1<span class="cm-syntax-function">$2</span>$3');
    }

    // Apply keyword highlighting
    if (keywords.length > 0) {
      const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
      patterns.push({ regex: keywordRegex, class: 'cm-syntax-keyword' });
    }

    // Apply patterns (in reverse order to avoid conflicts)
    for (const pattern of patterns) {
      escaped = escaped.replace(pattern.regex, `<span class="${pattern.class}">$1</span>`);
    }

    return escaped;
  }

  ignoreEvent() { return false; }
}

class BulletWidget extends WidgetType {
  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-list-bullet';
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

    // Handle Ctrl+Click for internal links
    a.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        // Check if it's an internal anchor link
        if (this.url.startsWith('#')) {
          const anchorId = this.url.substring(1);
          this.scrollToAnchor(a, anchorId);
        } else {
          // External link - open in default browser using Tauri shell
          shellOpen(this.url).catch(err => {
            console.error('[LinkWidget] Failed to open URL:', err);
          });
        }
      }
    });

    // Also listen to mousedown to prevent edit mode
    a.addEventListener('mousedown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    // Show hint on hover for Ctrl+Click (language based on browser settings)
    const isJapanese = navigator.language.startsWith('ja') || localStorage.getItem('language') === 'ja';
    a.title = isJapanese ? 'Ctrl+クリックでリンク先へ移動' : 'Ctrl+Click to follow link';

    return a;
  }

  // Scroll to the heading that matches the anchor ID
  private scrollToAnchor(element: HTMLElement, anchorId: string) {
    // Find the CodeMirror editor view
    const cmContent = element.closest('.cm-content');
    if (!cmContent) return;

    const cmEditor = cmContent.closest('.cm-editor');
    if (!cmEditor) return;

    // Get the EditorView from the DOM
    const view = (cmEditor as HTMLElement & { cmView?: EditorView }).cmView;
    if (!view) {
      // Fallback: dispatch custom event
      const event = new CustomEvent('scroll-to-anchor', {
        detail: { anchorId },
        bubbles: true
      });
      element.dispatchEvent(event);
      return;
    }

    // Search for the heading in the document
    const doc = view.state.doc;
    const normalizedAnchor = anchorId.toLowerCase().replace(/-/g, ' ');

    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      const text = line.text;

      // Check if this is a heading line
      const headingMatch = text.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const headingText = headingMatch[2].trim();
        // Normalize heading text for comparison
        const normalizedHeading = headingText.toLowerCase()
          .replace(/[^\w\s\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        if (normalizedHeading === normalizedAnchor ||
          headingText.toLowerCase() === anchorId.toLowerCase()) {
          // Scroll to this line
          view.dispatch({
            effects: EditorView.scrollIntoView(line.from, { y: 'start' }),
            selection: { anchor: line.from }
          });
          view.focus();
          return;
        }
      }
    }

    console.warn(`[LinkWidget] Anchor not found: #${anchorId}`);
  }

  ignoreEvent(event: Event) {
    // Ignore mouse events when Ctrl is pressed (allow navigation)
    if (event instanceof MouseEvent && (event.ctrlKey || event.metaKey)) {
      return true;
    }
    return false;
  }
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
  const baseDir = state.facet(baseDirFacet);

  // Add visual indicator for edit mode line
  const editLine = state.field(editModeState);
  if (editLine !== null && editLine >= 1 && editLine <= state.doc.lines) {
    const line = state.doc.line(editLine);
    decorations.push(Decoration.line({
      class: 'cm-edit-mode-line'
    }).range(line.from));
  }

  syntaxTree(state).iterate({
    enter: (node) => {
      if (node.name === 'StrongEmphasis' || node.name === 'Emphasis') {
        if (isInEditMode(state, node.from, node.to)) return;

        let c = node.node.cursor();
        c.firstChild();
        do {
          if (c.name === 'EmphasisMark') {
            decorations.push(Decoration.replace({}).range(c.from, c.to));
          }
        } while (c.nextSibling());
      }
      // Handle GFM Strikethrough (~~text~~)
      else if (node.name === 'Strikethrough') {
        if (isInEditMode(state, node.from, node.to)) return;

        let c = node.node.cursor();
        c.firstChild();
        do {
          if (c.name === 'StrikethroughMark') {
            decorations.push(Decoration.replace({}).range(c.from, c.to));
          }
        } while (c.nextSibling());
      }
      else if (node.name.startsWith('ATXHeading')) {
        if (isInEditMode(state, node.from, node.to)) return;

        let c = node.node.cursor();
        c.firstChild();
        do {
          if (c.name === 'HeaderMark') {
            // Hide the HeaderMark and any trailing space
            let endPos = c.to;
            // Check if there's a space after the HeaderMark
            const afterMark = state.sliceDoc(c.to, c.to + 1);
            if (afterMark === ' ') {
              endPos = c.to + 1;
            }
            decorations.push(Decoration.replace({}).range(c.from, endPos));
          }
        } while (c.nextSibling());
      }
      else if (node.name === 'Blockquote') {
        // Skip decoration if in edit mode for this blockquote
        if (isInEditMode(state, node.from, node.to)) return;

        // Also check if any ancestor Blockquote is in edit mode
        let ancestorParent = node.node.parent;
        while (ancestorParent) {
          if (ancestorParent.name === 'Blockquote' && isInEditMode(state, ancestorParent.from, ancestorParent.to)) {
            return; // Edit mode - ancestor blockquote in edit mode
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

        // Calculate indent for blockquote lines
        // We need to find the indentation of the first line to apply to all lines
        const firstLineText = state.sliceDoc(startLine.from, startLine.to);
        const indentMatch = firstLineText.match(/^(\s*)/);
        const indentSpaces = indentMatch ? indentMatch[1].length : 0;
        // Calculate indent in pixels (approximately 0.5em per space, assuming ~16px font = 8px per space)
        const indentPx = indentSpaces * 8;

        for (let i = startLine.number; i <= endLine.number; i++) {
          const line = state.doc.line(i);
          let className = `cm-blockquote-line cm-blockquote-level-${nestLevel}`;
          if (i === startLine.number) className += ' cm-blockquote-start';
          if (i === endLine.number) className += ' cm-blockquote-end';

          // Apply line decoration with custom indent style
          decorations.push(Decoration.line({
            class: className,
            attributes: indentPx > 0 ? { style: `--blockquote-indent: ${indentPx}px` } : {}
          }).range(line.from));
        }
      }
      else if (node.name === 'QuoteMark') {
        // Check if any ancestor Blockquote is in edit mode
        let parent = node.node.parent;
        while (parent) {
          if (parent.name === 'Blockquote' && isInEditMode(state, parent.from, parent.to)) {
            return; // Edit mode for entire blockquote hierarchy
          }
          parent = parent.parent;
        }

        // Hide the > mark and any following space, plus leading indent spaces
        const line = state.doc.lineAt(node.from);

        // Calculate how much to hide: from line start (including indent) to after > and space
        let hideEnd = node.to;
        // Check if there's a space after the > mark
        if (node.to < line.to && state.sliceDoc(node.to, node.to + 1) === ' ') {
          hideEnd = node.to + 1;
        }

        // Hide from line start to after > and space (includes leading indent)
        decorations.push(Decoration.replace({}).range(line.from, hideEnd));
      }
      else if (node.name === 'ListMark') {
        const text = state.sliceDoc(node.from, node.to);
        const line = state.doc.lineAt(node.from);

        if (['-', '*', '+'].includes(text)) {
          decorations.push(Decoration.replace({
            widget: new BulletWidget()
          }).range(node.from, node.to));

          // Add line decoration for hanging indent on bullet lists
          decorations.push(Decoration.line({
            class: 'cm-hanging-indent-bullet'
          }).range(line.from));
        } else if (/^\d+\.$/.test(text)) {
          // Ordered list (1. 2. 3.)
          decorations.push(Decoration.line({
            class: 'cm-hanging-indent-number'
          }).range(line.from));
        }
      }
      else if (node.name === 'Image') {
        if (isInEditMode(state, node.from, node.to)) return;

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
        if (isInEditMode(state, node.from, node.to)) return;

        const text = state.sliceDoc(node.from, node.to);
        const match = text.match(/^\[(.*?)\]\((.*?)\)/);
        if (match) {
          decorations.push(Decoration.replace({
            widget: new LinkWidget(match[1], match[2])
          }).range(node.from, node.to));
          return false;
        }
      }
      // Handle Autolink format: <http://example.com>
      else if (node.name === 'Autolink') {
        if (isInEditMode(state, node.from, node.to)) return;

        const text = state.sliceDoc(node.from, node.to);
        // Remove angle brackets from autolink
        const url = text.slice(1, -1);
        if (url.match(/^https?:\/\//)) {
          decorations.push(Decoration.replace({
            widget: new LinkWidget(url, url)
          }).range(node.from, node.to));
          return false;
        }
      }
      // Handle plain URLs (URL node from GFM)
      else if (node.name === 'URL') {
        if (isInEditMode(state, node.from, node.to)) return;

        const url = state.sliceDoc(node.from, node.to);
        if (url.match(/^https?:\/\//)) {
          decorations.push(Decoration.replace({
            widget: new LinkWidget(url, url)
          }).range(node.from, node.to));
          return false;
        }
      }
      else if (node.name === 'Table') {
        // Calculate the actual table end position by finding the last line that starts with |
        // Lezer parser sometimes includes non-table lines in the table node
        const tableStartLine = state.doc.lineAt(node.from);
        let actualTableEnd = node.to;

        // Scan through lines to find the last line that starts with |
        for (let lineNum = tableStartLine.number; lineNum <= state.doc.lines; lineNum++) {
          const line = state.doc.line(lineNum);
          if (line.from > node.to) break; // Don't go beyond original node end

          const trimmedLine = line.text.trim();
          if (trimmedLine.startsWith('|') || trimmedLine.match(/^[\s]*[-:|]+[\s]*$/)) {
            // This is a table row (starts with |) or a delimiter row (like |---|---|)
            actualTableEnd = line.to;
          } else if (trimmedLine === '') {
            // Empty line could be okay, continue
            continue;
          } else {
            // Non-table content - stop here
            break;
          }
        }

        // Skip if in edit mode (use actual table end)
        if (isInEditMode(state, node.from, actualTableEnd)) return;

        // Parse the table data
        const tableData: TableData = {
          headers: [],
          rows: [],
          alignments: [],
          from: node.from,
          to: actualTableEnd
        };

        let cursor = node.node.cursor();
        if (cursor.firstChild()) {
          if (cursor.name === 'TableHeader') {
            // Parse header text manually to capture empty cells
            const headerText = state.sliceDoc(cursor.from, cursor.to);
            const trimmed = headerText.trim();
            const inner = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
            const final = inner.endsWith('|') ? inner.slice(0, -1) : inner;
            tableData.headers = final.split('|').map(cell => cell.trim());
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
              // Skip rows beyond the actual table end
              if (child.from > actualTableEnd) {
                child = child.nextSibling;
                continue;
              }
              // Parse row text manually to capture empty cells that Lezer doesn't recognize
              const rowText = state.sliceDoc(child.from, Math.min(child.to, actualTableEnd));
              // Only include lines that start with |
              if (rowText.trim().startsWith('|')) {
                const row = parseTableRow(rowText);
                tableData.rows.push(row);
              }
            }
            child = child.nextSibling;
          }
        }

        // Helper function to parse a table row text into cells
        function parseTableRow(text: string): string[] {
          const trimmed = text.trim();
          // Remove leading and trailing |
          const inner = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
          const final = inner.endsWith('|') ? inner.slice(0, -1) : inner;
          return final.split('|').map(cell => cell.trim());
        }

        try {
          decorations.push(Decoration.replace({
            widget: new TableWidget(tableData)
          }).range(node.from, actualTableEnd));
        } catch (e) {
          console.error('Failed to add table decoration:', e);
        }
        return false;
      }
      else if (node.name === 'InlineCode') {
        if (isInEditMode(state, node.from, node.to)) return;

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

        // Extract language from the first line
        const firstLineText = state.sliceDoc(startLine.from, startLine.to);
        const langMatch = firstLineText.match(/^```(\w+)/);
        const language = langMatch ? langMatch[1].toLowerCase() : '';

        const isEditMode = isInEditMode(state, node.from, node.to);

        // Special handling for Mermaid code blocks
        if (language === 'mermaid' && !isEditMode) {
          // Extract the mermaid code (excluding fence lines)
          let mermaidCode = '';
          for (let i = startLine.number + 1; i < endLine.number; i++) {
            const line = state.doc.line(i);
            mermaidCode += state.sliceDoc(line.from, line.to) + '\n';
          }
          mermaidCode = mermaidCode.trim();

          if (mermaidCode) {
            decorations.push(Decoration.replace({
              widget: new MermaidWidget(mermaidCode)
            }).range(node.from, node.to));
          }
          return false;
        }

        // Standard code block handling
        if (isEditMode) {
          // Focused: show all lines with styling for editing
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
          // Not focused: replace entire block with widget (like Table/Mermaid)
          // Extract code content (excluding fence lines)
          let codeContent = '';
          for (let i = startLine.number + 1; i < endLine.number; i++) {
            const line = state.doc.line(i);
            codeContent += state.sliceDoc(line.from, line.to) + '\n';
          }
          // Remove trailing newline
          if (codeContent.endsWith('\n')) {
            codeContent = codeContent.slice(0, -1);
          }

          decorations.push(Decoration.replace({
            widget: new CodeBlockWidget(codeContent, language)
          }).range(node.from, node.to));
          return false;
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

    // Skip if in edit mode for this details block
    if (isInEditMode(state, from, to)) continue;

    const summaryText = match[1].trim();
    const contentText = match[2].trim();

    decorations.push(Decoration.replace({
      widget: new DetailsWidget(summaryText, contentText)
    }).range(from, to));
  }

  // Detect and render general HTML blocks (not part of markdown syntax tree)
  // Skip if already handled by <details> or inside code blocks
  const htmlBlocks = findHTMLBlocks(docText);

  // Get ranges that are already decorated (details, code blocks, etc.)
  const decoratedRanges: { from: number; to: number }[] = [];

  // Add details ranges
  detailsRegex.lastIndex = 0;
  while ((match = detailsRegex.exec(docText)) !== null) {
    decoratedRanges.push({ from: match.index, to: match.index + match[0].length });
  }

  // Add code block ranges from syntax tree
  syntaxTree(state).iterate({
    enter: (node) => {
      if (node.name === 'FencedCode' || node.name === 'CodeBlock' || node.name === 'InlineCode') {
        decoratedRanges.push({ from: node.from, to: node.to });
      }
      // Also add Table ranges to prevent HTML inside tables from being replaced
      if (node.name === 'Table') {
        decoratedRanges.push({ from: node.from, to: node.to });
      }
    }
  });

  for (const block of htmlBlocks) {
    // Skip if in edit mode
    if (isInEditMode(state, block.from, block.to)) continue;

    // Skip if overlaps with already decorated ranges
    const overlaps = decoratedRanges.some(r =>
      (block.from >= r.from && block.from < r.to) ||
      (block.to > r.from && block.to <= r.to) ||
      (block.from <= r.from && block.to >= r.to)
    );
    if (overlaps) continue;

    // Skip if it looks like Markdown table (pipes at start/end of lines)
    const content = block.content.trim();
    if (content.startsWith('|') && content.includes('\n')) continue;

    decorations.push(Decoration.replace({
      widget: new HTMLWidget(block.content)
    }).range(block.from, block.to));
  }

  // Sort decorations by from position and return as RangeSet
  return RangeSet.of(decorations, true);
}

// StateField for hybrid decorations
const hybridViewField = StateField.define<DecorationSet>({
  create(state) {
    return computeHybridDecorations(state);
  },
  update(decorations, tr) {
    // Also update when edit mode changes
    if (tr.docChanged || tr.selection || tr.state.facet(baseDirFacet) !== tr.startState.facet(baseDirFacet) || tr.effects.some(e => e.is(setEditModeLine))) {
      return computeHybridDecorations(tr.state);
    }
    return decorations;
  },
  provide: field => EditorView.decorations.from(field)
});

// Export the combined extensions
export const hybridView = [
  editModeState,
  editModeClickHandler,
  editModeKeymap,
  autoEditModeOnInput,
  hybridViewField
];

// Export editModeState for external access
export { editModeState };
