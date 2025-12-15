import { RangeSet, StateField, EditorState, Facet, Range } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { readFile } from '@tauri-apps/plugin-fs';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import { TableWidget, TableData } from './table-widget';
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

    // Show hint on hover for Ctrl+Click
    a.title = 'Ctrl+クリックでリンク先へ移動';

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
      // Handle Autolink format: <http://example.com>
      else if (node.name === 'Autolink') {
        if (selection.from >= node.from && selection.to <= node.to) return;

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
        if (selection.from >= node.from && selection.to <= node.to) return;

        const url = state.sliceDoc(node.from, node.to);
        if (url.match(/^https?:\/\//)) {
          decorations.push(Decoration.replace({
            widget: new LinkWidget(url, url)
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

        // Extract language from the first line
        const firstLineText = state.sliceDoc(startLine.from, startLine.to);
        const langMatch = firstLineText.match(/^```(\w+)/);
        const language = langMatch ? langMatch[1].toLowerCase() : '';

        const isFocused = selection.from >= node.from && selection.to <= node.to;

        // Special handling for Mermaid code blocks
        if (language === 'mermaid' && !isFocused) {
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

        // Standard code block handling (for non-mermaid or focused)
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
