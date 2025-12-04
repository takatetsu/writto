import { marked } from 'marked';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

export async function exportHtml(doc: string): Promise<void> {
  try {
    const htmlContent = await marked(doc);
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Exported Markdown</title>
<style>
body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
h1, h2, h3 { border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
code { background-color: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
blockquote { border-left: 4px solid #ccc; margin: 0; padding-left: 10px; color: #666; }
img { max-width: 100%; }
</style>
</head>
<body>
${htmlContent}
</body>
</html>
    `;

    const path = await save({
      filters: [{
        name: 'HTML',
        extensions: ['html']
      }]
    });

    if (path) {
      await writeTextFile(path, fullHtml);
    }
  } catch (err) {
    console.error('Failed to export HTML:', err);
  }
}
