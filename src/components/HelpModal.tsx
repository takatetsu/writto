import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/I18nContext';
import { open as shellOpen } from '@tauri-apps/plugin-shell';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    darkMode: boolean;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, darkMode }) => {
    const { t } = useTranslation();
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [activeTab, setActiveTab] = useState<'usage' | 'markdown'>('usage');

    useEffect(() => {
        if (isOpen) {
            // Center the window initially
            const x = (window.innerWidth - 600) / 2;
            const y = (window.innerHeight - 500) / 2;
            setPosition({ x, y });
            setActiveTab('usage');
        }
    }, [isOpen]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseMove = (e: MouseEvent) => {
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
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const handleOpenMarkdownGuide = async () => {
        try {
            await shellOpen('https://www.markdownguide.org/basic-syntax/');
        } catch (err) {
            console.error('Failed to open Markdown Guide:', err);
        }
    };

    if (!isOpen) return null;

    const tabStyle = (isActive: boolean): React.CSSProperties => ({
        padding: '8px 16px',
        border: 'none',
        background: isActive
            ? (darkMode ? '#3a3a3a' : '#fff')
            : (darkMode ? '#2d2d2d' : '#f0f0f0'),
        color: isActive
            ? (darkMode ? '#e0e0e0' : '#333')
            : (darkMode ? '#888' : '#666'),
        cursor: 'pointer',
        borderBottom: isActive ? `2px solid ${darkMode ? '#58a6ff' : '#0066cc'}` : '2px solid transparent',
        fontWeight: isActive ? 'bold' : 'normal',
        fontSize: '0.9em',
    });

    const sectionStyle: React.CSSProperties = {
        marginBottom: '20px',
    };

    const headingStyle: React.CSSProperties = {
        fontSize: '1em',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: darkMode ? '#e0e0e0' : '#333',
    };

    const textStyle: React.CSSProperties = {
        fontSize: '0.9em',
        color: darkMode ? '#a0a0a0' : '#666',
        lineHeight: '1.6',
        margin: '0',
    };

    const shortcutRowStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 0',
        borderBottom: `1px solid ${darkMode ? '#444' : '#eee'}`,
    };

    const kbdStyle: React.CSSProperties = {
        background: darkMode ? '#444' : '#f0f0f0',
        padding: '2px 6px',
        borderRadius: '3px',
        fontFamily: 'monospace',
        fontSize: '0.85em',
        color: darkMode ? '#e0e0e0' : '#333',
    };

    const mdTableStyle: React.CSSProperties = {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.85em',
    };

    const mdCellStyle: React.CSSProperties = {
        padding: '6px 8px',
        borderBottom: `1px solid ${darkMode ? '#444' : '#eee'}`,
        color: darkMode ? '#a0a0a0' : '#666',
    };

    const mdCodeStyle: React.CSSProperties = {
        fontFamily: 'monospace',
        background: darkMode ? '#444' : '#f5f5f5',
        padding: '2px 4px',
        borderRadius: '3px',
        color: darkMode ? '#e0e0e0' : '#333',
    };

    return (
        <div className="modal-overlay" style={{ pointerEvents: 'none' }}>
            <div
                className={`modal-content window-style ${darkMode ? 'dark' : ''}`}
                style={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y,
                    margin: 0,
                    pointerEvents: 'auto',
                    width: '600px',
                    maxHeight: '80vh',
                    overflow: 'hidden',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    border: '1px solid #ccc',
                    backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                    zIndex: 2000,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div
                    className="window-header"
                    onMouseDown={handleMouseDown}
                    style={{
                        padding: '10px',
                        backgroundColor: darkMode ? '#3a3a3a' : '#f3f3f3',
                        borderBottom: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                        cursor: 'move',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        userSelect: 'none'
                    }}
                >
                    <span style={{ fontWeight: 'bold', fontSize: '0.9em', color: darkMode ? '#e0e0e0' : '#333' }}>
                        {t('help.title')}
                    </span>
                    <div
                        onClick={onClose}
                        style={{ cursor: 'pointer', padding: '0 5px', color: darkMode ? '#e0e0e0' : '#333' }}
                    >
                        &#10005;
                    </div>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                    backgroundColor: darkMode ? '#2d2d2d' : '#f9f9f9',
                }}>
                    <button
                        style={tabStyle(activeTab === 'usage')}
                        onClick={() => setActiveTab('usage')}
                    >
                        {t('help.tabUsage')}
                    </button>
                    <button
                        style={tabStyle(activeTab === 'markdown')}
                        onClick={() => setActiveTab('markdown')}
                    >
                        {t('help.tabMarkdown')}
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    padding: '20px',
                    overflow: 'auto',
                    flex: 1,
                    maxHeight: 'calc(80vh - 120px)',
                }}>
                    {activeTab === 'usage' && (
                        <div>
                            <div style={sectionStyle}>
                                <h3 style={headingStyle}>{t('help.viewEditMode')}</h3>
                                <p style={textStyle}>{t('help.viewEditDesc')}</p>
                            </div>

                            <div style={sectionStyle}>
                                <h3 style={headingStyle}>{t('help.tableOps')}</h3>
                                <p style={textStyle}>{t('help.tableOpsDesc')}</p>
                            </div>

                            <div style={sectionStyle}>
                                <h3 style={headingStyle}>{t('help.imageInsert')}</h3>
                                <p style={textStyle}>{t('help.imageInsertDesc')}</p>
                            </div>

                            <div style={sectionStyle}>
                                <h3 style={headingStyle}>{t('help.links')}</h3>
                                <p style={textStyle}>{t('help.linksDesc')}</p>
                            </div>

                            <div style={sectionStyle}>
                                <h3 style={headingStyle}>{t('help.shortcuts')}</h3>
                                <div>
                                    <div style={shortcutRowStyle}>
                                        <span style={textStyle}>{t('help.shortcut.save')}</span>
                                        <span style={kbdStyle}>Ctrl + S</span>
                                    </div>
                                    <div style={shortcutRowStyle}>
                                        <span style={textStyle}>{t('help.shortcut.open')}</span>
                                        <span style={kbdStyle}>Ctrl + O</span>
                                    </div>
                                    <div style={shortcutRowStyle}>
                                        <span style={textStyle}>{t('help.shortcut.new')}</span>
                                        <span style={kbdStyle}>Ctrl + N</span>
                                    </div>
                                    <div style={shortcutRowStyle}>
                                        <span style={textStyle}>{t('help.shortcut.find')}</span>
                                        <span style={kbdStyle}>Ctrl + F</span>
                                    </div>
                                    <div style={shortcutRowStyle}>
                                        <span style={textStyle}>{t('help.shortcut.print')}</span>
                                        <span style={kbdStyle}>Ctrl + P</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'markdown' && (
                        <div>
                            <table style={mdTableStyle}>
                                <tbody>
                                    <tr>
                                        <td style={mdCellStyle}>{t('help.md.heading')}</td>
                                        <td style={mdCellStyle}><code style={mdCodeStyle}># H1</code> <code style={mdCodeStyle}>## H2</code> <code style={mdCodeStyle}>### H3</code></td>
                                    </tr>
                                    <tr>
                                        <td style={mdCellStyle}>{t('help.md.bold')}</td>
                                        <td style={mdCellStyle}><code style={mdCodeStyle}>**text**</code></td>
                                    </tr>
                                    <tr>
                                        <td style={mdCellStyle}>{t('help.md.italic')}</td>
                                        <td style={mdCellStyle}><code style={mdCodeStyle}>*text*</code></td>
                                    </tr>
                                    <tr>
                                        <td style={mdCellStyle}>{t('help.md.strike')}</td>
                                        <td style={mdCellStyle}><code style={mdCodeStyle}>~~text~~</code></td>
                                    </tr>
                                    <tr>
                                        <td style={mdCellStyle}>{t('help.md.code')}</td>
                                        <td style={mdCellStyle}><code style={mdCodeStyle}>`code`</code></td>
                                    </tr>
                                    <tr>
                                        <td style={mdCellStyle}>{t('help.md.codeblock')}</td>
                                        <td style={mdCellStyle}><code style={mdCodeStyle}>```language</code></td>
                                    </tr>
                                    <tr>
                                        <td style={mdCellStyle}>{t('help.md.link')}</td>
                                        <td style={mdCellStyle}><code style={mdCodeStyle}>[text](url)</code></td>
                                    </tr>
                                    <tr>
                                        <td style={mdCellStyle}>{t('help.md.image')}</td>
                                        <td style={mdCellStyle}><code style={mdCodeStyle}>![alt](path)</code></td>
                                    </tr>
                                    <tr>
                                        <td style={mdCellStyle}>{t('help.md.list')}</td>
                                        <td style={mdCellStyle}><code style={mdCodeStyle}>- item</code></td>
                                    </tr>
                                    <tr>
                                        <td style={mdCellStyle}>{t('help.md.orderedList')}</td>
                                        <td style={mdCellStyle}><code style={mdCodeStyle}>1. item</code></td>
                                    </tr>
                                    <tr>
                                        <td style={mdCellStyle}>{t('help.md.checkbox')}</td>
                                        <td style={mdCellStyle}><code style={mdCodeStyle}>- [ ] task</code> / <code style={mdCodeStyle}>- [x] done</code></td>
                                    </tr>
                                    <tr>
                                        <td style={mdCellStyle}>{t('help.md.quote')}</td>
                                        <td style={mdCellStyle}><code style={mdCodeStyle}>&gt; quote</code></td>
                                    </tr>
                                    <tr>
                                        <td style={mdCellStyle}>{t('help.md.table')}</td>
                                        <td style={mdCellStyle}><code style={mdCodeStyle}>| A | B |</code></td>
                                    </tr>
                                    <tr>
                                        <td style={mdCellStyle}>{t('help.md.hr')}</td>
                                        <td style={mdCellStyle}><code style={mdCodeStyle}>---</code></td>
                                    </tr>
                                </tbody>
                            </table>

                            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                <button
                                    onClick={handleOpenMarkdownGuide}
                                    style={{
                                        padding: '8px 16px',
                                        background: darkMode ? '#3a3a3a' : '#f0f0f0',
                                        color: darkMode ? '#58a6ff' : '#0066cc',
                                        border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.9em',
                                    }}
                                >
                                    {t('help.moreInfo')} ↗
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
