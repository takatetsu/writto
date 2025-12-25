import React from 'react';
import { useTranslation } from '../contexts/I18nContext';

interface StatusBarProps {
    darkMode: boolean;
    isEditMode: boolean;
    cursorLine: number;
    cursorColumn: number;
}

const StatusBar: React.FC<StatusBarProps> = ({
    darkMode,
    isEditMode,
    cursorLine,
    cursorColumn
}) => {
    const { t } = useTranslation();

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 12px',
                height: '24px',
                backgroundColor: darkMode ? '#2d2d2d' : '#f3f3f3',
                borderTop: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                fontSize: '0.8em',
                color: darkMode ? '#a0a0a0' : '#666',
                userSelect: 'none',
            }}
        >
            {/* Left side - Mode indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        backgroundColor: isEditMode
                            ? (darkMode ? '#3a5a3a' : '#e6f4e6')
                            : (darkMode ? '#3a3a5a' : '#e6e6f4'),
                        color: isEditMode
                            ? (darkMode ? '#8fd88f' : '#2d7a2d')
                            : (darkMode ? '#8f8fd8' : '#2d2d7a'),
                        fontWeight: '500',
                    }}
                >
                    {isEditMode ? t('status.editMode') : t('status.viewMode')}
                </span>
            </div>

            {/* Right side - Cursor position */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>
                    {t('status.line')}: {cursorLine}
                </span>
                <span>
                    {t('status.column')}: {cursorColumn}
                </span>
            </div>
        </div>
    );
};

export default StatusBar;
