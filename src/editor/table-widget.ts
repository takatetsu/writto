import { WidgetType } from '@codemirror/view';
import { getInitialLanguage, translations } from '../lib/i18n';

// Parse inline content in table cells - handle both HTML tags and Markdown syntax
function parseTableCellContent(text: string): string {
    // First, escape all HTML to prevent XSS
    let result = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Then, selectively unescape safe inline HTML tags
    // <br> and <br/> and <br />
    result = result.replace(/&lt;br\s*\/?&gt;/gi, '<br>');

    // <b>...</b> and <strong>...</strong>
    result = result.replace(/&lt;(b|strong)&gt;/gi, '<$1>');
    result = result.replace(/&lt;\/(b|strong)&gt;/gi, '</$1>');

    // <i>...</i> and <em>...</em>
    result = result.replace(/&lt;(i|em)&gt;/gi, '<$1>');
    result = result.replace(/&lt;\/(i|em)&gt;/gi, '</$1>');

    // <u>...</u>
    result = result.replace(/&lt;u&gt;/gi, '<u>');
    result = result.replace(/&lt;\/u&gt;/gi, '</u>');

    // <s>...</s> and <del>...</del>
    result = result.replace(/&lt;(s|del)&gt;/gi, '<$1>');
    result = result.replace(/&lt;\/(s|del)&gt;/gi, '</$1>');

    // <mark>...</mark>
    result = result.replace(/&lt;mark&gt;/gi, '<mark>');
    result = result.replace(/&lt;\/mark&gt;/gi, '</mark>');

    // <code>...</code>
    result = result.replace(/&lt;code&gt;/gi, '<code>');
    result = result.replace(/&lt;\/code&gt;/gi, '</code>');

    // <sub>...</sub> and <sup>...</sup>
    result = result.replace(/&lt;(sub|sup)&gt;/gi, '<$1>');
    result = result.replace(/&lt;\/(sub|sup)&gt;/gi, '</$1>');

    // Now handle Markdown inline syntax
    // **bold** or __bold__
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // *italic* or _italic_ (but not inside words for _)
    result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    result = result.replace(/(?<![a-zA-Z])_([^_]+)_(?![a-zA-Z])/g, '<em>$1</em>');

    // ~~strikethrough~~
    result = result.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // `code`
    result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

    return result;
}


export interface TableData {
    headers: string[];
    rows: string[][];
    alignments: ('left' | 'center' | 'right' | null)[];
    // Position in the document for table manipulation
    from?: number;
    to?: number;
}

// Custom event for table operations
export interface TableOperationEvent {
    operation: 'addRowAbove' | 'addRowBelow' | 'addColumnLeft' | 'addColumnRight' | 'deleteRow' | 'deleteColumn';
    rowIndex: number;
    colIndex: number;
    from: number;
    to: number;
}

export class TableWidget extends WidgetType {
    constructor(readonly data: TableData) {
        super();
    }

    eq(other: TableWidget) {
        if (this.data.headers.length !== other.data.headers.length) return false;
        if (this.data.rows.length !== other.data.rows.length) return false;

        // Fast path: reference equality (unlikely but possible)
        if (this.data === other.data) return true;

        // Deep comparison
        return JSON.stringify(this.data) === JSON.stringify(other.data);
    }

    toDOM() {
        try {
            const lang = getInitialLanguage();
            const t = translations[lang];

            const container = document.createElement('div');
            container.className = 'cm-table-container';
            container.style.position = 'relative';

            const table = document.createElement('table');
            table.className = 'cm-md-table';
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';
            table.style.marginBottom = '1em';
            table.style.border = '1px solid var(--border-color, #ddd)';

            // Header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            headerRow.style.backgroundColor = 'var(--table-header-bg, #f5f5f5)';

            this.data.headers.forEach((headerText, colIndex) => {
                const th = document.createElement('th');
                const trimmed = headerText.trim();
                th.innerHTML = trimmed ? parseTableCellContent(trimmed) : ' ';
                th.style.padding = '8px 12px';
                th.style.border = '1px solid var(--border-color, #ddd)';
                th.style.textAlign = this.data.alignments[colIndex] || 'left';
                th.style.minWidth = '40px';
                th.dataset.row = '-1'; // Header row
                th.dataset.col = colIndex.toString();
                // Mark empty cells
                if (!trimmed) {
                    th.style.backgroundColor = 'var(--table-empty-cell, rgba(0,0,0,0.03))';
                }

                // Add context menu handler
                th.addEventListener('contextmenu', (e) => this.handleContextMenu(e, -1, colIndex, container, t));

                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Body
            const tbody = document.createElement('tbody');
            this.data.rows.forEach((row, rowIndex) => {
                const tr = document.createElement('tr');
                if (rowIndex % 2 === 1) {
                    tr.style.backgroundColor = 'var(--table-row-alt-bg, #fafafa)';
                }

                row.forEach((cellText, colIndex) => {
                    const td = document.createElement('td');
                    const trimmed = cellText.trim();
                    td.innerHTML = trimmed ? parseTableCellContent(trimmed) : '\u00A0'; // Use non-breaking space for empty cells
                    td.style.padding = '8px 12px';
                    td.style.border = '1px solid var(--border-color, #ddd)';
                    const align = this.data.alignments[colIndex] || 'left';
                    td.style.textAlign = align;
                    td.style.minWidth = '40px';
                    td.dataset.row = rowIndex.toString();
                    td.dataset.col = colIndex.toString();
                    // Mark empty cells
                    if (!trimmed) {
                        td.style.backgroundColor = 'var(--table-empty-cell, rgba(0,0,0,0.03))';
                    }

                    // Add context menu handler
                    td.addEventListener('contextmenu', (e) => this.handleContextMenu(e, rowIndex, colIndex, container, t));

                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            container.appendChild(table);

            return container;
        } catch (e) {
            console.error('Error rendering TableWidget:', e);
            const span = document.createElement('span');
            span.textContent = '[Table Render Error]';
            span.style.color = 'red';
            return span;
        }
    }

    private handleContextMenu(
        e: MouseEvent,
        rowIndex: number,
        colIndex: number,
        container: HTMLElement,
        t: Record<string, string>
    ) {
        e.preventDefault();
        e.stopPropagation();

        // Remove any existing context menu
        const existingMenu = document.querySelector('.cm-table-context-menu');
        if (existingMenu) existingMenu.remove();

        // Create context menu
        const menu = document.createElement('div');
        menu.className = 'cm-table-context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${e.clientX}px;
            top: ${e.clientY}px;
            background-color: var(--bg-primary, #fff);
            border: 1px solid var(--border-color, #ddd);
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            padding: 4px 0;
            min-width: 160px;
        `;

        const menuItems: Array<{ label?: string; operation?: string; type?: string }> = [
            { label: t['table.addRowAbove'], operation: 'addRowAbove' },
            { label: t['table.addRowBelow'], operation: 'addRowBelow' },
            { type: 'separator' },
            { label: t['table.addColumnLeft'], operation: 'addColumnLeft' },
            { label: t['table.addColumnRight'], operation: 'addColumnRight' },
        ];

        // Add delete options if table has more than 1 row/column
        if (this.data.rows.length > 1 || rowIndex === -1) {
            menuItems.push({ type: 'separator' });
            if (rowIndex >= 0 && this.data.rows.length > 1) {
                menuItems.push({ label: t['table.deleteRow'], operation: 'deleteRow' });
            }
            if (this.data.headers.length > 1) {
                menuItems.push({ label: t['table.deleteColumn'], operation: 'deleteColumn' });
            }
        }

        menuItems.forEach(item => {
            if (item.type === 'separator') {
                const separator = document.createElement('div');
                separator.style.cssText = `
                    height: 1px;
                    background-color: var(--border-color, #ddd);
                    margin: 4px 0;
                `;
                menu.appendChild(separator);
            } else {
                const button = document.createElement('button');
                button.textContent = item.label || '';
                button.style.cssText = `
                    display: block;
                    width: 100%;
                    padding: 8px 16px;
                    border: none;
                    background-color: transparent;
                    color: var(--text-primary, #333);
                    text-align: left;
                    cursor: pointer;
                    font-size: 0.9em;
                `;

                button.addEventListener('mouseenter', () => {
                    button.style.backgroundColor = 'var(--hover-bg, #f0f0f0)';
                });
                button.addEventListener('mouseleave', () => {
                    button.style.backgroundColor = 'transparent';
                });

                button.addEventListener('click', () => {
                    const op = item.operation!;
                    menu.remove();
                    // Use setTimeout to ensure menu is fully removed before dispatching
                    setTimeout(() => {
                        this.dispatchTableOperation(op, rowIndex, colIndex, container);
                    }, 0);
                }, { once: true });

                menu.appendChild(button);
            }
        });

        document.body.appendChild(menu);

        // Adjust position if menu goes off screen
        const menuRect = menu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) {
            menu.style.left = `${window.innerWidth - menuRect.width - 10}px`;
        }
        if (menuRect.bottom > window.innerHeight) {
            menu.style.top = `${window.innerHeight - menuRect.height - 10}px`;
        }

        // Close menu when clicking outside
        const closeMenu = (event: MouseEvent) => {
            if (!menu.contains(event.target as Node)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }

    private dispatchTableOperation(
        operation: string,
        rowIndex: number,
        colIndex: number,
        container: HTMLElement
    ) {
        const event = new CustomEvent<TableOperationEvent>('table-operation', {
            bubbles: true,
            detail: {
                operation: operation as TableOperationEvent['operation'],
                rowIndex,
                colIndex,
                from: this.data.from || 0,
                to: this.data.to || 0
            }
        });
        container.dispatchEvent(event);
    }

    ignoreEvent() { return false; }
}
