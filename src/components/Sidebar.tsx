import React, { useState, useMemo, useRef, useEffect } from 'react';
import { readDirectory, FileEntry, createFolder, createFile, renameFileOrFolder, deleteFileOrFolder, copyFileOrFolder, moveFileOrFolder } from '../lib/fs';
import { FolderOpenIcon, FolderIcon, FileIcon, ArrowUpIcon, EditIcon, CopyIcon, TrashIcon } from './Icons';

interface SidebarProps {
    onFileSelect: (path: string) => void;
    doc: string;
    onNavigate: (line: number) => void;
    activeFileDir?: string;
    currentFilePath?: string | null;
}

interface OutlineItem {
    line: number;
    level: number;
    text: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onFileSelect, doc, onNavigate, activeFileDir, currentFilePath }) => {
    const [currentPath, setCurrentPath] = useState<string | null>(null);
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [activeTab, setActiveTab] = useState<'files' | 'outline'>('files');
    const [width, setWidth] = useState(250);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        targetPath: string;
        targetName: string;
        isDirectory: boolean;
    } | null>(null);
    const [adjustedMenuPosition, setAdjustedMenuPosition] = useState<{ x: number; y: number } | null>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    // Drag and drop state
    const [draggedItem, setDraggedItem] = useState<{ path: string; name: string; isDirectory: boolean } | null>(null);
    const [dropTarget, setDropTarget] = useState<string | null>(null);

    // Adjust context menu position to stay within viewport
    useEffect(() => {
        if (contextMenu?.visible && contextMenuRef.current) {
            const menuRect = contextMenuRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let adjustedX = contextMenu.x;
            let adjustedY = contextMenu.y;

            // Adjust horizontal position if menu would overflow right edge
            if (contextMenu.x + menuRect.width > viewportWidth) {
                adjustedX = viewportWidth - menuRect.width - 5;
            }

            // Adjust vertical position if menu would overflow bottom edge
            if (contextMenu.y + menuRect.height > viewportHeight) {
                adjustedY = viewportHeight - menuRect.height - 5;
            }

            // Ensure menu doesn't go off the left or top edge
            adjustedX = Math.max(5, adjustedX);
            adjustedY = Math.max(5, adjustedY);

            setAdjustedMenuPosition({ x: adjustedX, y: adjustedY });
        } else {
            setAdjustedMenuPosition(null);
        }
    }, [contextMenu]);

    const startResizing = React.useCallback(() => {
        setIsResizing(true);
    }, []);

    const stopResizing = React.useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = React.useCallback(
        (mouseMoveEvent: MouseEvent) => {
            if (isResizing) {
                const newWidth = mouseMoveEvent.clientX;
                if (newWidth > 150 && newWidth < 800) {
                    setWidth(newWidth);
                }
            }
        },
        [isResizing]
    );

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);



    const loadDirectory = async (path: string) => {
        setCurrentPath(path);
        const entries = await readDirectory(path);
        setFiles(entries);
    };

    useEffect(() => {
        if (activeFileDir) {
            loadDirectory(activeFileDir);
        }
    }, [activeFileDir]);

    const handleDirClick = (path: string) => {
        loadDirectory(path);
    };

    const handleUpDir = () => {
        if (currentPath) {
            const parent = currentPath.substring(0, currentPath.lastIndexOf(currentPath.includes('\\') ? '\\' : '/'));
            if (parent && parent !== currentPath) { // Simple check, might need more robust path handling
                loadDirectory(parent);
            }
        }
    };

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        if (contextMenu?.visible) {
            window.addEventListener('click', handleClick);
            return () => window.removeEventListener('click', handleClick);
        }
    }, [contextMenu]);

    // Handle right-click on file/folder
    const handleContextMenu = (e: React.MouseEvent, path: string, name: string, isDirectory: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            targetPath: path,
            targetName: name,
            isDirectory
        });
    };

    // Handle context menu actions
    const handleCreateFolder = async () => {
        if (!currentPath) return;
        const folderName = prompt('新しいフォルダの名前を入力してください:');
        if (folderName && folderName.trim()) {
            const success = await createFolder(currentPath, folderName.trim());
            if (success) {
                loadDirectory(currentPath);
            }
        }
        setContextMenu(null);
    };

    const handleCreateFile = async () => {
        if (!currentPath) return;
        const fileName = prompt('新しいファイルの名前を入力してください (.md / .txt 拡張子がなければ.mdを追加):');
        if (fileName && fileName.trim()) {
            const success = await createFile(currentPath, fileName.trim());
            if (success) {
                loadDirectory(currentPath);
            }
        }
        setContextMenu(null);
    };

    const handleRename = async () => {
        if (!contextMenu) return;
        const newName = prompt('新しい名前を入力してください:', contextMenu.targetName);
        if (newName && newName.trim() && newName !== contextMenu.targetName) {
            const newPath = await renameFileOrFolder(contextMenu.targetPath, newName.trim());
            if (newPath && currentPath) {
                loadDirectory(currentPath);
            }
        }
        setContextMenu(null);
    };

    const handleDelete = async () => {
        if (!contextMenu) return;
        const confirmMsg = contextMenu.isDirectory
            ? `フォルダ "${contextMenu.targetName}" とその中身を削除しますか？`
            : `ファイル "${contextMenu.targetName}" を削除しますか？`;

        if (confirm(confirmMsg)) {
            const success = await deleteFileOrFolder(contextMenu.targetPath, contextMenu.isDirectory);
            if (success && currentPath) {
                loadDirectory(currentPath);
            }
        }
        setContextMenu(null);
    };

    const handleCopy = async () => {
        if (!contextMenu) return;
        const success = await copyFileOrFolder(contextMenu.targetPath, contextMenu.isDirectory);
        if (success && currentPath) {
            loadDirectory(currentPath);
        }
        setContextMenu(null);
    };

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, path: string, name: string, isDirectory: boolean) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', path);
        e.dataTransfer.setData('application/x-sidebar-item', JSON.stringify({ path, name, isDirectory }));
        setDraggedItem({ path, name, isDirectory });
    };

    const handleDragEnter = (e: React.DragEvent, _targetPath: string, targetIsDirectory: boolean) => {
        // Only allow drop on directories
        if (!targetIsDirectory) return;

        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragOver = (e: React.DragEvent, targetPath: string, targetIsDirectory: boolean) => {
        // Only allow drop on directories
        if (!targetIsDirectory) return;

        // Always prevent default to allow drop on directories
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        // Update drop target for visual feedback
        if (dropTarget !== targetPath) {
            setDropTarget(targetPath);
        }
    };

    const handleDragLeave = () => {
        setDropTarget(null);
    };

    const handleDrop = async (e: React.DragEvent, targetPath: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDropTarget(null);

        // Try to get dragged item info from state first
        let itemInfo = draggedItem;

        // If state is not available, try dataTransfer
        if (!itemInfo) {
            try {
                const jsonData = e.dataTransfer.getData('application/x-sidebar-item');
                if (jsonData) {
                    itemInfo = JSON.parse(jsonData);
                }
            } catch {
                // Fallback: get path from text/plain
                const path = e.dataTransfer.getData('text/plain');
                if (path) {
                    const separator = path.includes('\\') ? '\\' : '/';
                    const name = path.substring(path.lastIndexOf(separator) + 1);
                    itemInfo = { path, name, isDirectory: false };
                }
            }
        }

        if (!itemInfo) {
            setDraggedItem(null);
            return;
        }

        // Prevent dropping on itself
        if (itemInfo.path === targetPath) {
            setDraggedItem(null);
            return;
        }

        // Prevent dropping a folder into its own subfolder
        if (itemInfo.isDirectory) {
            const separator = itemInfo.path.includes('\\') ? '\\' : '/';
            if (targetPath.startsWith(itemInfo.path + separator)) {
                alert('フォルダを自身のサブフォルダに移動することはできません。');
                setDraggedItem(null);
                return;
            }
        }

        const success = await moveFileOrFolder(itemInfo.path, targetPath, itemInfo.isDirectory);
        if (success && currentPath) {
            loadDirectory(currentPath);
        }
        setDraggedItem(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDropTarget(null);
    };

    const outline = useMemo(() => {
        const lines = doc.split('\n');
        const items: OutlineItem[] = [];
        lines.forEach((text, index) => {
            const match = text.match(/^(#{1,6})\s+(.*)/);
            if (match) {
                items.push({
                    line: index + 1,
                    level: match[1].length,
                    text: match[2]
                });
            }
        });
        return items;
    }, [doc]);

    return (
        <div ref={sidebarRef} style={{ width: `${width}px`, minWidth: '150px', backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-color)', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', color: 'var(--sidebar-text)' }}>
            <div
                style={{
                    width: '5px',
                    cursor: 'col-resize',
                    height: '100%',
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    zIndex: 100,
                }}
                onMouseDown={startResizing}
            />
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                <div
                    style={{ flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer', backgroundColor: activeTab === 'files' ? 'var(--hover-bg)' : 'transparent', fontWeight: activeTab === 'files' ? 'bold' : 'normal' }}
                    onClick={() => setActiveTab('files')}
                >
                    ファイル
                </div>
                <div
                    style={{ flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer', backgroundColor: activeTab === 'outline' ? 'var(--hover-bg)' : 'transparent', fontWeight: activeTab === 'outline' ? 'bold' : 'normal' }}
                    onClick={() => setActiveTab('outline')}
                >
                    アウトライン
                </div>
            </div>

            {activeTab === 'files' ? (
                <>
                    <div
                        style={{ flex: 1, overflowY: 'auto', padding: '5px 0' }}
                        onDragOver={(e) => {
                            // Allow drop on the container (current directory)
                            if (currentPath) {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                            }
                        }}
                        onDragEnter={() => {
                            // Container drag enter (no action needed)
                        }}
                        onDrop={(e) => {
                            // Drop on the container means drop on current directory
                            if (currentPath && draggedItem) {
                                handleDrop(e, currentPath);
                            }
                        }}
                        onContextMenu={(e) => {
                            if (currentPath) {
                                e.preventDefault();
                                e.stopPropagation();
                                const separator = currentPath.includes('\\') ? '\\' : '/';
                                const folderName = currentPath.split(separator).pop() || currentPath;
                                setContextMenu({
                                    visible: true,
                                    x: e.clientX,
                                    y: e.clientY,
                                    targetPath: currentPath,
                                    targetName: folderName,
                                    isDirectory: true
                                });
                            }
                        }}
                    >
                        {currentPath ? (
                            <>
                                <div style={{
                                    padding: '5px 10px',
                                    fontSize: '0.85em',
                                    fontWeight: 'bold',
                                    color: 'var(--text-secondary)',
                                    borderBottom: '1px solid var(--border-light)',
                                    marginBottom: '5px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }} title={currentPath}>
                                    <FolderOpenIcon /> {currentPath.split(/[\\/]/).pop()}
                                </div>
                                <div
                                    style={{
                                        padding: '2px 10px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontSize: '0.9em',
                                        color: 'var(--text-muted)',
                                        fontStyle: 'italic',
                                        backgroundColor: dropTarget && currentPath && dropTarget === currentPath.substring(0, currentPath.lastIndexOf(currentPath.includes('\\') ? '\\' : '/')) ? 'var(--drag-highlight)' : 'transparent'
                                    }}
                                    onClick={handleUpDir}
                                    onDragEnter={(e) => {
                                        if (currentPath) {
                                            const parentPath = currentPath.substring(0, currentPath.lastIndexOf(currentPath.includes('\\') ? '\\' : '/'));
                                            if (parentPath) handleDragEnter(e, parentPath, true);
                                        }
                                    }}
                                    onDragOver={(e) => {
                                        if (currentPath) {
                                            const parentPath = currentPath.substring(0, currentPath.lastIndexOf(currentPath.includes('\\') ? '\\' : '/'));
                                            if (parentPath) handleDragOver(e, parentPath, true);
                                        }
                                    }}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => {
                                        if (currentPath) {
                                            const parentPath = currentPath.substring(0, currentPath.lastIndexOf(currentPath.includes('\\') ? '\\' : '/'));
                                            if (parentPath) handleDrop(e, parentPath);
                                        }
                                    }}
                                >
                                    <ArrowUpIcon /> ..
                                </div>
                                {files.map(file => (
                                    <div
                                        key={file.path}
                                        draggable
                                        style={{
                                            padding: '2px 10px',
                                            cursor: 'grab',
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontSize: '0.9em',
                                            color: 'var(--sidebar-text)',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            backgroundColor: dropTarget === file.path ? 'var(--drag-highlight)' :
                                                currentFilePath === file.path ? 'var(--sidebar-highlight)' : 'transparent',
                                            opacity: draggedItem?.path === file.path ? 0.5 : 1
                                        }}
                                        onClick={() => file.isDirectory ? handleDirClick(file.path) : onFileSelect(file.path)}
                                        onContextMenu={(e) => handleContextMenu(e, file.path, file.name, file.isDirectory)}
                                        onDragStart={(e) => handleDragStart(e, file.path, file.name, file.isDirectory)}
                                        onDragEnter={(e) => handleDragEnter(e, file.path, file.isDirectory)}
                                        onDragOver={(e) => handleDragOver(e, file.path, file.isDirectory)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, file.path)}
                                        onDragEnd={handleDragEnd}
                                        title={file.name}
                                    >
                                        {file.isDirectory ? <FolderIcon /> : <FileIcon />}
                                        {file.name}
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '0.9em' }}>
                                No folder opened
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                    {outline.length > 0 ? (
                        outline.map((item, i) => (
                            <div
                                key={i}
                                style={{
                                    paddingLeft: `${(item.level - 1) * 15}px`,
                                    paddingBottom: '5px',
                                    cursor: 'pointer',
                                    fontSize: '0.9em',
                                    color: 'var(--sidebar-text)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                                onClick={() => onNavigate(item.line)}
                            >
                                {item.text}
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', color: '#888', fontSize: '0.9em' }}>No headers found</div>
                    )}
                </div>
            )}
            {contextMenu?.visible && (
                <div
                    ref={contextMenuRef}
                    style={{
                        position: 'fixed',
                        left: adjustedMenuPosition?.x ?? contextMenu.x,
                        top: adjustedMenuPosition?.y ?? contextMenu.y,
                        backgroundColor: 'var(--menu-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        boxShadow: '0 2px 10px var(--shadow-color)',
                        zIndex: 10000,
                        minWidth: '180px',
                        padding: '4px 0'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: '0.9em',
                            color: 'var(--text-primary)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        onClick={handleCreateFolder}
                    >
                        <FolderIcon /> フォルダ新規作成
                    </div>
                    <div
                        style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: '0.9em',
                            color: 'var(--text-primary)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        onClick={handleCreateFile}
                    >
                        <FileIcon /> ファイル新規作成
                    </div>
                    <div style={{ height: '1px', backgroundColor: 'var(--border-light)', margin: '4px 0' }} />
                    <div
                        style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: '0.9em',
                            color: 'var(--text-primary)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        onClick={handleRename}
                    >
                        <EditIcon /> 名称変更
                    </div>
                    <div
                        style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: '0.9em',
                            color: 'var(--text-primary)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        onClick={handleCopy}
                    >
                        <CopyIcon /> 複製
                    </div>
                    <div style={{ height: '1px', backgroundColor: 'var(--border-light)', margin: '4px 0' }} />
                    <div
                        style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: '0.9em',
                            color: '#d32f2f'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ffebee'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        onClick={handleDelete}
                    >
                        <TrashIcon /> 削除
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sidebar;
