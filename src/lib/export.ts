import { marked } from 'marked';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile, writeFile, readFile } from '@tauri-apps/plugin-fs';
import jsPDF from 'jspdf';

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

// Helper function to convert image file to Base64 data URI
async function imageToBase64(imagePath: string): Promise<string | null> {
  try {
    const imageData = await readFile(imagePath);

    // Determine MIME type from extension
    const ext = imagePath.toLowerCase().split('.').pop();
    let mimeType = 'image/png';
    if (ext === 'jpg' || ext === 'jpeg') {
      mimeType = 'image/jpeg';
    } else if (ext === 'gif') {
      mimeType = 'image/gif';
    } else if (ext === 'webp') {
      mimeType = 'image/webp';
    } else if (ext === 'svg') {
      mimeType = 'image/svg+xml';
    }

    // Convert Uint8Array to base64
    let binary = '';
    const bytes = new Uint8Array(imageData);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return `data:${mimeType};base64,${base64}`;
  } catch (err) {
    console.error('Failed to read image:', imagePath, err);
    return null;
  }
}

// Helper function to resolve relative path to absolute path
function resolveImagePath(src: string, basePath: string): string {
  // Decode URL-encoded path (e.g., %E5%86%99%E7%9C%9F.jpg -> 写真.jpg)
  let decodedSrc = decodeURIComponent(src);

  // If already absolute or data URI, return as-is
  if (decodedSrc.startsWith('data:') || decodedSrc.startsWith('http://') || decodedSrc.startsWith('https://')) {
    return decodedSrc;
  }

  // Determine path separator
  const separator = basePath.includes('\\') ? '\\' : '/';

  // Handle relative paths
  if (decodedSrc.startsWith('./')) {
    decodedSrc = decodedSrc.substring(2);
  }

  // Combine base path with relative path
  const fullPath = basePath.endsWith(separator) ? basePath + decodedSrc : basePath + separator + decodedSrc;

  // Normalize path separators for Windows
  return fullPath.replace(/\//g, separator);
}

// Process HTML to embed images as Base64
async function processImagesInHtml(html: string, basePath: string | undefined): Promise<string> {
  if (!basePath) {
    return html;
  }

  // Match all img tags with src attribute
  const imgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  const matches = [...html.matchAll(imgRegex)];

  let processedHtml = html;

  for (const match of matches) {
    const fullTag = match[0];
    const srcValue = match[1];

    // Skip if already a data URI or absolute URL
    if (srcValue.startsWith('data:') || srcValue.startsWith('http://') || srcValue.startsWith('https://')) {
      continue;
    }

    // Resolve the path and convert to base64
    const absolutePath = resolveImagePath(srcValue, basePath);
    const base64Data = await imageToBase64(absolutePath);

    if (base64Data) {
      // Replace the src in the tag
      const newTag = fullTag.replace(srcValue, base64Data);
      processedHtml = processedHtml.replace(fullTag, newTag);
    }
  }

  return processedHtml;
}

export async function exportPdf(doc: string, basePath?: string): Promise<void> {
  // Dynamic import of html2canvas to avoid bundling issues
  const html2canvas = (await import('html2canvas')).default;

  try {
    // breaks: true で単一改行を <br> として保持
    let htmlContent = await marked(doc, { breaks: true });

    // Process images to embed as Base64
    htmlContent = await processImagesInHtml(htmlContent, basePath);

    // Create a temporary container for rendering
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 794px;
      background: white;
      padding: 40px;
      font-family: 'Yu Gothic', 'Meiryo', sans-serif;
      font-size: 14px;
      line-height: 1.8;
      color: #333;
    `;

    // Add styles for markdown content
    container.innerHTML = `
      <style>
        * { box-sizing: border-box; }
        h1 { font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 8px; margin: 24px 0 16px 0; }
        h2 { font-size: 20px; border-bottom: 1px solid #666; padding-bottom: 6px; margin: 20px 0 12px 0; }
        h3 { font-size: 16px; margin: 16px 0 10px 0; }
        p { margin: 0 0 12px 0; }
        code { background-color: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: 'Consolas', 'MS Gothic', monospace; font-size: 13px; }
        pre { background-color: #f5f5f5; padding: 12px; border-radius: 5px; overflow-x: auto; margin: 12px 0; }
        pre code { background: none; padding: 0; }
        blockquote { border-left: 4px solid #ccc; margin: 12px 0; padding-left: 16px; color: #666; }
        ul, ol { margin: 8px 0; padding-left: 24px; }
        li { margin: 4px 0; }
        table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        img { max-width: 100%; height: auto; }
        a { color: #0066cc; }
      </style>
      <div class="content">${htmlContent}</div>
    `;

    document.body.appendChild(container);

    try {
      // Capture the container as canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Calculate dimensions for A4
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          0,
          position,
          imgWidth,
          imgHeight
        );
        heightLeft -= pageHeight;
      }

      // Get PDF as ArrayBuffer
      const pdfArrayBuffer = pdf.output('arraybuffer');
      const pdfUint8Array = new Uint8Array(pdfArrayBuffer);

      // Show save dialog
      const path = await save({
        filters: [{
          name: 'PDF',
          extensions: ['pdf']
        }]
      });

      if (path) {
        await writeFile(path, pdfUint8Array);
      }
    } finally {
      // Clean up
      document.body.removeChild(container);
    }
  } catch (err) {
    console.error('Failed to export PDF:', err);
    alert('PDFのエクスポートに失敗しました。');
  }
}


