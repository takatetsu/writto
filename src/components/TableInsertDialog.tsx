import React, { useState } from 'react';
import { getInitialLanguage, translations } from '../lib/i18n';

interface TableInsertDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (rows: number, cols: number) => void;
}

export const TableInsertDialog: React.FC<TableInsertDialogProps> = ({ isOpen, onClose, onInsert }) => {
    const [rows, setRows] = useState(3);
    const [cols, setCols] = useState(3);
    const lang = getInitialLanguage();
    const t = translations[lang];

    if (!isOpen) return null;

    const handleInsert = () => {
        if (rows > 0 && cols > 0) {
            onInsert(rows, cols);
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleInsert();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div
            className="table-insert-dialog-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
            }}
        >
            <div
                className="table-insert-dialog"
                style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '8px',
                    padding: '20px',
                    minWidth: '280px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-color)',
                }}
                onKeyDown={handleKeyDown}
            >
                <h3 style={{
                    margin: '0 0 16px 0',
                    color: 'var(--text-primary)',
                    fontSize: '1.1em',
                }}>
                    {t['table.insertTitle']}
                </h3>

                <div style={{ marginBottom: '12px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '4px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.9em',
                    }}>
                        {t['table.rows']}
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="50"
                        value={rows}
                        onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '1em',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '4px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.9em',
                    }}>
                        {t['table.columns']}
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="20"
                        value={cols}
                        onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '1em',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.9em',
                        }}
                    >
                        {t['table.cancel']}
                    </button>
                    <button
                        onClick={handleInsert}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.9em',
                        }}
                    >
                        {t['table.insert']}
                    </button>
                </div>
            </div>
        </div>
    );
};
