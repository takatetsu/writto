import {
    Decoration,
    DecorationSet,
    EditorView,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { RangeSetBuilder } from '@codemirror/state';

class CheckboxWidget extends WidgetType {
    constructor(readonly checked: boolean, readonly pos: number) {
        super();
    }

    eq(other: CheckboxWidget) {
        return other.checked === this.checked && other.pos === this.pos;
    }

    toDOM(view: EditorView) {
        const wrap = document.createElement('span');
        wrap.className = 'cm-checkbox';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = this.checked;
        input.style.cursor = 'pointer';

        input.onclick = (e) => {
            e.preventDefault(); // Prevent default selection behavior
            const pos = this.pos;
            const currentText = view.state.doc.sliceString(pos, pos + 3); // "[ ]" or "[x]"

            // Verify we are still at the right place
            if (currentText !== (this.checked ? '[x]' : '[ ]')) {
                // Maybe try to find it nearby or just bail?
                // For now, let's assume position is stable enough for click
            }

            const newText = this.checked ? '[ ]' : '[x]';
            view.dispatch({
                changes: { from: pos, to: pos + 3, insert: newText }
            });
            return true;
        };

        wrap.appendChild(input);
        return wrap;
    }

    ignoreEvent() {
        return false;
    }
}

function checkboxes(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>();

    for (const { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
            from,
            to,
            enter: (node) => {
                if (node.name === 'TaskMarker') {
                    const isChecked = view.state.sliceDoc(node.from, node.to).includes('x');

                    // Find the list marker (e.g., "- ") before the task marker
                    // The pattern is typically: "- [ ]" where "- " is the ListMark
                    const lineStart = view.state.doc.lineAt(node.from).from;
                    const textBeforeMarker = view.state.sliceDoc(lineStart, node.from);

                    // Find where the list marker starts (look for "- " or "* " pattern)
                    const listMarkerMatch = textBeforeMarker.match(/^(\s*)(-|\*|\+)\s*$/);

                    if (listMarkerMatch) {
                        // Hide from the list marker to the end of TaskMarker
                        const listMarkerStart = lineStart + listMarkerMatch[1].length;
                        builder.add(
                            listMarkerStart,
                            node.to,
                            Decoration.replace({
                                widget: new CheckboxWidget(isChecked, node.from),
                            })
                        );
                    } else {
                        // Fallback: just replace the TaskMarker as before
                        builder.add(
                            node.from,
                            node.to,
                            Decoration.replace({
                                widget: new CheckboxWidget(isChecked, node.from),
                            })
                        );
                    }
                }
            },
        });
    }

    return builder.finish();
}

export const checkboxPlugin = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;
        constructor(view: EditorView) {
            this.decorations = checkboxes(view);
        }
        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged || update.selectionSet) {
                this.decorations = checkboxes(update.view);
            }
        }
    },
    {
        decorations: (v) => v.decorations,
    }
);
