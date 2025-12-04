import { WidgetType } from '@codemirror/view';

export interface TableData {
    headers: string[];
    rows: string[][];
    alignments: ('left' | 'center' | 'right' | null)[];
}

export class TableWidget extends WidgetType {
    constructor(readonly data: TableData) {
        super();
        // console.log('TableWidget created', data); // Debug logging
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
            const table = document.createElement('table');
            table.className = 'cm-md-table';
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';
            table.style.marginBottom = '1em';
            table.style.border = '1px solid var(--border-color, #ddd)';
            // Prevent layout thrashing by setting a min-height or similar if needed
            // table.style.contain = 'content'; // might help performance

            // Header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            headerRow.style.backgroundColor = 'var(--table-header-bg, #f5f5f5)';

            this.data.headers.forEach((headerText, i) => {
                const th = document.createElement('th');
                th.textContent = headerText;
                th.style.padding = '8px 12px';
                th.style.border = '1px solid var(--border-color, #ddd)';
                th.style.textAlign = this.data.alignments[i] || 'left';
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

                row.forEach((cellText, i) => {
                    const td = document.createElement('td');
                    td.textContent = cellText;
                    td.style.padding = '8px 12px';
                    td.style.border = '1px solid var(--border-color, #ddd)';
                    const align = this.data.alignments[i] || 'left';
                    td.style.textAlign = align;
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);

            return table;
        } catch (e) {
            console.error('Error rendering TableWidget:', e);
            const span = document.createElement('span');
            span.textContent = '[Table Render Error]';
            span.style.color = 'red';
            return span;
        }
    }

    ignoreEvent() { return false; }
}
