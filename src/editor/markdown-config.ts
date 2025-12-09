import { MarkdownConfig } from "@lezer/markdown";

// Custom Markdown configuration that excludes Setext headings
// This prevents confusion when typing bullet lists starting with "-"
// while preserving all other GFM features including TaskList (checkboxes)
export const GFMWithoutSetext: MarkdownConfig = {
    remove: ["SetextHeading"]
};
