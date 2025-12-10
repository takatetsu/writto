import { EditorView } from '@codemirror/view';

/**
 * Detects if text is a tab-separated table (from Excel/spreadsheet)
 * Returns true if text has multiple rows with tab separators
 */
function isTabularData(text: string): boolean {
    const lines = text.trim().split('\n');
    if (lines.length < 1) return false;

    // Count lines that contain at least one tab
    const linesWithTabs = lines.filter(line => line.includes('\t'));

    // If no lines have tabs, not tabular data
    if (linesWithTabs.length === 0) return false;

    // For single line with tabs, treat as table row
    if (lines.length === 1 && lines[0].includes('\t')) {
        return true;
    }

    // For multiple lines, if most lines have tabs, treat as tabular data
    // This handles cases where Excel data has varying column counts
    const tabRatio = linesWithTabs.length / lines.length;
    return tabRatio >= 0.5; // At least 50% of lines should have tabs
}

/**
 * Converts tab-separated text to Markdown table format
 */
function convertToMarkdownTable(text: string): string {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return text;

    const rows = lines.map(line =>
        line.split('\t').map(cell => {
            const trimmed = cell.trim();
            // Use '-' for empty cells to make them visible
            return trimmed === '' ? '-' : trimmed;
        })
    );

    // Calculate column widths for alignment (optional, for readability)
    const columnCount = Math.max(...rows.map(row => row.length));

    // Build markdown table
    const result: string[] = [];

    rows.forEach((row, index) => {
        // Pad row to have consistent column count
        while (row.length < columnCount) {
            row.push('-');
        }

        // Create table row
        const rowStr = '| ' + row.join(' | ') + ' |';
        result.push(rowStr);

        // Add separator after first row (header)
        if (index === 0) {
            const separator = '| ' + row.map(() => '---').join(' | ') + ' |';
            result.push(separator);
        }
    });

    return result.join('\n');
}

/**
 * Creates a paste handler extension for CodeMirror
 * Converts tab-separated data (from Excel, etc.) to Markdown tables
 */
export const excelPasteHandler = EditorView.domEventHandlers({
    paste(event: ClipboardEvent, view: EditorView) {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        // Get plain text from clipboard
        const text = clipboardData.getData('text/plain');
        if (!text) return false;

        // Check if this looks like tabular data
        if (!isTabularData(text)) {
            // Not tabular data, let default paste behavior handle it
            return false;
        }

        // Convert to markdown table
        const markdownTable = convertToMarkdownTable(text);

        // Insert the markdown table
        const { from, to } = view.state.selection.main;
        view.dispatch({
            changes: { from, to, insert: markdownTable },
            selection: { anchor: from + markdownTable.length }
        });

        // Prevent default paste behavior
        event.preventDefault();
        return true;
    }
});
