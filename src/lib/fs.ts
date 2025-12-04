import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile, mkdir, remove, rename, copyFile, exists } from '@tauri-apps/plugin-fs';

export async function openFile(): Promise<{ content: string; path: string } | null> {
  try {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'Markdown',
        extensions: ['md', 'markdown']
      }]
    });

    if (selected === null) return null;

    // In Tauri v2, selected is string or string[] (if multiple)
    // We set multiple: false, so it should be string or null.
    // However, type definition might say string | string[] | null.
    const path = Array.isArray(selected) ? selected[0] : selected;
    if (!path) return null;

    const content = await readTextFile(path);
    return { content, path };
  } catch (err) {
    console.error('Failed to open file:', err);
    return null;
  }
}

export async function saveFile(path: string, content: string): Promise<boolean> {
  try {
    await writeTextFile(path, content);
    return true;
  } catch (err) {
    console.error('Failed to save file:', err);
    return false;
  }
}

export async function saveFileAs(content: string): Promise<{ path: string } | null> {
  try {
    const path = await save({
      filters: [{
        name: 'Markdown',
        extensions: ['md', 'markdown']
      }]
    });

    if (!path) return null;

    await writeTextFile(path, content);
    return { path };
  } catch (err) {
    console.error('Failed to save file as:', err);
    return null;
  }
}

import { readDir } from '@tauri-apps/plugin-fs';

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
}

export async function readFileContent(path: string): Promise<string | null> {
  try {
    return await readTextFile(path);
  } catch (err) {
    console.error('Failed to read file:', err);
    return null;
  }
}

export async function readDirectory(path: string): Promise<FileEntry[]> {
  try {
    const entries = await readDir(path);
    // Sort directories first, then files
    return entries
      .filter(entry => entry.isDirectory || entry.name.endsWith('.md')) // Filter for directories and markdown files
      .map(entry => {
        // Robust path joining
        const separator = path.includes('\\') ? '\\' : '/';
        const fullPath = path.endsWith(separator) ? path + entry.name : path + separator + entry.name;

        return {
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory,
        };
      })
      .sort((a, b) => {
        if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
        return a.isDirectory ? -1 : 1;
      });
  } catch (err) {
    console.error('Failed to read directory:', err);
    return [];
  }
}

export async function openFolder(): Promise<string | null> {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
    });
    return typeof selected === 'string' ? selected : null;
  } catch (err) {
    console.error('Failed to open folder:', err);
    return null;
  }
}

// Create a new folder
export async function createFolder(parentPath: string, folderName: string): Promise<boolean> {
  try {
    const separator = parentPath.includes('\\') ? '\\' : '/';
    const newPath = parentPath.endsWith(separator) ? parentPath + folderName : parentPath + separator + folderName;

    // Check if folder already exists
    const folderExists = await exists(newPath);
    if (folderExists) {
      alert('同じ名前のフォルダが既に存在します。');
      return false;
    }

    await mkdir(newPath);
    return true;
  } catch (err) {
    console.error('Failed to create folder:', err);
    alert('フォルダの作成に失敗しました。');
    return false;
  }
}

// Create a new file
export async function createFile(parentPath: string, fileName: string): Promise<boolean> {
  try {
    const separator = parentPath.includes('\\') ? '\\' : '/';
    // Ensure .md extension
    const fileNameWithExt = fileName.endsWith('.md') ? fileName : fileName + '.md';
    const newPath = parentPath.endsWith(separator) ? parentPath + fileNameWithExt : parentPath + separator + fileNameWithExt;

    // Check if file already exists
    const fileExists = await exists(newPath);
    if (fileExists) {
      alert('同じ名前のファイルが既に存在します。');
      return false;
    }

    await writeTextFile(newPath, '');
    return true;
  } catch (err) {
    console.error('Failed to create file:', err);
    alert('ファイルの作成に失敗しました。');
    return false;
  }
}

// Rename a file or folder
export async function renameFileOrFolder(oldPath: string, newName: string): Promise<string | null> {
  try {
    const separator = oldPath.includes('\\') ? '\\' : '/';
    const parentPath = oldPath.substring(0, oldPath.lastIndexOf(separator));
    const newPath = parentPath + separator + newName;

    // Check if target already exists
    const targetExists = await exists(newPath);
    if (targetExists) {
      alert('同じ名前のファイルまたはフォルダが既に存在します。');
      return null;
    }

    await rename(oldPath, newPath);
    return newPath;
  } catch (err) {
    console.error('Failed to rename:', err);
    alert('名前の変更に失敗しました。');
    return null;
  }
}

// Delete a file or folder
export async function deleteFileOrFolder(path: string, isDirectory: boolean): Promise<boolean> {
  try {
    await remove(path, { recursive: isDirectory });
    return true;
  } catch (err) {
    console.error('Failed to delete:', err);
    alert('削除に失敗しました。');
    return false;
  }
}

// Copy a file or folder
export async function copyFileOrFolder(sourcePath: string, isDirectory: boolean): Promise<boolean> {
  try {
    const separator = sourcePath.includes('\\') ? '\\' : '/';
    const fileName = sourcePath.substring(sourcePath.lastIndexOf(separator) + 1);
    const parentPath = sourcePath.substring(0, sourcePath.lastIndexOf(separator));

    // Generate new name with " - Copy" suffix
    let newName: string;
    if (isDirectory) {
      newName = fileName + ' - Copy';
    } else {
      const dotIndex = fileName.lastIndexOf('.');
      if (dotIndex > 0) {
        newName = fileName.substring(0, dotIndex) + ' - Copy' + fileName.substring(dotIndex);
      } else {
        newName = fileName + ' - Copy';
      }
    }

    let destPath = parentPath + separator + newName;
    let counter = 1;

    // Find unique name if copy already exists
    while (await exists(destPath)) {
      if (isDirectory) {
        newName = fileName + ` - Copy (${counter})`;
      } else {
        const dotIndex = fileName.lastIndexOf('.');
        if (dotIndex > 0) {
          newName = fileName.substring(0, dotIndex) + ` - Copy (${counter})` + fileName.substring(dotIndex);
        } else {
          newName = fileName + ` - Copy (${counter})`;
        }
      }
      destPath = parentPath + separator + newName;
      counter++;
    }

    if (isDirectory) {
      // For directories, we need to recursively copy
      await copyDirectoryRecursive(sourcePath, destPath);
    } else {
      // For files, use copyFile
      await copyFile(sourcePath, destPath);
    }

    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    alert('複製に失敗しました。');
    return false;
  }
}

// Helper function to recursively copy directories
async function copyDirectoryRecursive(sourcePath: string, destPath: string): Promise<void> {
  await mkdir(destPath);
  const entries = await readDir(sourcePath);

  for (const entry of entries) {
    const separator = sourcePath.includes('\\') ? '\\' : '/';
    const srcPath = sourcePath.endsWith(separator) ? sourcePath + entry.name : sourcePath + separator + entry.name;
    const dstPath = destPath.endsWith(separator) ? destPath + entry.name : destPath + separator + entry.name;

    if (entry.isDirectory) {
      await copyDirectoryRecursive(srcPath, dstPath);
    } else {
      await copyFile(srcPath, dstPath);
    }
  }
}

