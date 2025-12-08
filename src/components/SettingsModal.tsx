import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: {
        fontSize: number;
        fontFamily: string;
        defaultFolderMode: 'none' | 'specific' | 'last';
        defaultFolderPath: string;
        editorWidth: number;
    };
    onSave: (settings: { fontSize: number; fontFamily: string; defaultFolderMode: 'none' | 'specific' | 'last'; defaultFolderPath: string; editorWidth: number }) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
    const [fontSize, setFontSize] = useState(settings.fontSize);
    const [fontFamily, setFontFamily] = useState(settings.fontFamily);
    const [defaultFolderMode, setDefaultFolderMode] = useState<'none' | 'specific' | 'last'>(settings.defaultFolderMode);
    const [defaultFolderPath, setDefaultFolderPath] = useState(settings.defaultFolderPath);
    const [editorWidth, setEditorWidth] = useState(settings.editorWidth);
    const [availableFonts, setAvailableFonts] = useState<string[]>([]);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [showDeveloperSection, setShowDeveloperSection] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Center the window initially
            const x = (window.innerWidth - 400) / 2;
            const y = (window.innerHeight - 300) / 2;
            setPosition({ x, y });
        }
    }, [isOpen]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove as any);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove as any);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove as any);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    useEffect(() => {
        if (isOpen) {
            setFontSize(settings.fontSize);
            setFontFamily(settings.fontFamily);
            setEditorWidth(settings.editorWidth);
            setDefaultFolderMode(settings.defaultFolderMode);
            setDefaultFolderPath(settings.defaultFolderPath);

            // Fetch system fonts
            invoke<string[]>('get_system_fonts')
                .then(fonts => {
                    // Sort and remove duplicates
                    const uniqueFonts = Array.from(new Set(fonts)).sort();
                    setAvailableFonts(uniqueFonts);
                })
                .catch(err => console.error('Failed to fetch fonts:', err));
        }
    }, [isOpen, settings]);

    const handleSave = () => {
        onSave({ fontSize, fontFamily, defaultFolderMode, defaultFolderPath, editorWidth });
        onClose();
    };

    const handleSelectFolder = async () => {
        const selected = await open({
            directory: true,
            multiple: false,
            title: 'フォルダを選択'
        });
        if (selected && typeof selected === 'string') {
            setDefaultFolderPath(selected);
        }
    };

    const handleClearStorage = () => {
        if (confirm('すべての設定をクリアして初期値に戻しますか?')) {
            localStorage.clear();
            alert('ストレージをクリアしました。アプリケーションを再起動してください。');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ pointerEvents: 'none' }}>
            <div
                className="modal-content window-style"
                style={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y,
                    margin: 0,
                    pointerEvents: 'auto',
                    width: '450px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    border: '1px solid #ccc',
                    backgroundColor: '#fff',
                    zIndex: 2000
                }}
            >
                <div
                    className="window-header"
                    onMouseDown={handleMouseDown}
                    style={{
                        padding: '10px',
                        backgroundColor: '#f3f3f3',
                        borderBottom: '1px solid #ddd',
                        cursor: 'move',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        userSelect: 'none'
                    }}
                >
                    <span style={{ fontWeight: 'bold', fontSize: '0.9em' }}>Settings</span>
                    <div
                        onClick={onClose}
                        style={{ cursor: 'pointer', padding: '0 5px' }}
                    >
                        &#10005;
                    </div>
                </div>
                <div style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '1em', fontWeight: 'bold', color: '#333' }}>フォント設定</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label>Font Size:</label>
                                <input
                                    type="number"
                                    value={fontSize}
                                    onChange={(e) => setFontSize(Number(e.target.value))}
                                    style={{ width: '70px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                <label>Font Family:</label>
                                <select
                                    value={fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value)}
                                    style={{ flex: 1, maxWidth: '200px' }}
                                >
                                    <option value="Consolas, monospace">Default (Consolas)</option>
                                    {availableFonts.map(font => (
                                        <option key={font} value={`${font}, monospace`}>{font}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '1em', fontWeight: 'bold', color: '#333' }}>エディタ幅</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <input
                                type="range"
                                min="50"
                                max="100"
                                value={editorWidth}
                                onChange={(e) => setEditorWidth(Number(e.target.value))}
                                style={{ flex: 1 }}
                            />
                            <span style={{ minWidth: '50px', textAlign: 'right' }}>{editorWidth}%</span>
                        </div>
                    </div>
                    <div className="setting-item" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>規定で開くフォルダ:</label>
                        <div style={{ marginLeft: '10px', marginTop: '8px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    value="none"
                                    checked={defaultFolderMode === 'none'}
                                    onChange={(e) => setDefaultFolderMode(e.target.value as 'none')}
                                    style={{ marginRight: '5px' }}
                                />
                                なし
                            </label>
                            <label style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    value="specific"
                                    checked={defaultFolderMode === 'specific'}
                                    onChange={(e) => setDefaultFolderMode(e.target.value as 'specific')}
                                    style={{ marginRight: '5px' }}
                                />
                                指定するフォルダ
                            </label>
                            <label style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    value="last"
                                    checked={defaultFolderMode === 'last'}
                                    onChange={(e) => setDefaultFolderMode(e.target.value as 'last')}
                                    style={{ marginRight: '5px' }}
                                />
                                前回使ったフォルダ
                            </label>
                        </div>
                        {defaultFolderMode === 'specific' && (
                            <div style={{ marginTop: '10px', marginLeft: '10px' }}>
                                <button
                                    onClick={handleSelectFolder}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#5a9fd4',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        marginBottom: '8px'
                                    }}
                                >
                                    フォルダを選択
                                </button>
                                {defaultFolderPath && (
                                    <div style={{
                                        fontSize: '0.85em',
                                        color: '#666',
                                        padding: '5px',
                                        backgroundColor: '#f9f9f9',
                                        borderRadius: '3px',
                                        wordBreak: 'break-all'
                                    }}>
                                        {defaultFolderPath}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="modal-actions" style={{ marginTop: '20px' }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#9e9e9e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginRight: '8px'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#5a9fd4',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Save
                        </button>
                    </div>
                    <div style={{ borderTop: '1px solid #ddd', paddingTop: '12px', marginTop: '15px' }}>
                        <div
                            onClick={() => setShowDeveloperSection(!showDeveloperSection)}
                            style={{
                                cursor: 'pointer',
                                fontSize: '0.9em',
                                fontWeight: 'bold',
                                color: '#666',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                userSelect: 'none'
                            }}
                        >
                            <span>{showDeveloperSection ? '▼' : '▶'}</span>
                            開発者向け
                        </div>
                        {showDeveloperSection && (
                            <div style={{ marginTop: '10px' }}>
                                <button
                                    onClick={handleClearStorage}
                                    style={{
                                        width: 'auto',
                                        padding: '6px 12px',
                                        backgroundColor: '#e57373',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.9em'
                                    }}
                                >
                                    ストレージをクリア
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
