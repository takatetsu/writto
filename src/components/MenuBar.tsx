import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../contexts/I18nContext';

interface MenuBarProps {
    onNew: () => void;
    onOpen: () => void;
    onSave: () => void;
    onSaveAs: () => void;
    onExportHtml: () => void;
    onPrint: () => void;
    onSettings: () => void;
    onFind: () => void;
    onToggleLineNumbers: () => void;
    showLineNumbers: boolean;
    wordWrap: boolean;
    onToggleWordWrap: () => void;
    showSidebar: boolean;
    onToggleSidebar: () => void;
    darkMode: boolean;
    onToggleDarkMode: () => void;
    onAbout: () => void;
    onCheckForUpdates: () => void;
    onExit: () => void;
}

const MenuBar: React.FC<MenuBarProps> = ({
    onNew, onOpen, onSave, onSaveAs, onExportHtml, onPrint, onSettings, onFind, showLineNumbers, onToggleLineNumbers, wordWrap, onToggleWordWrap, showSidebar, onToggleSidebar, darkMode, onToggleDarkMode, onAbout, onCheckForUpdates, onExit
}) => {
    const { t } = useTranslation();
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setActiveMenu(null);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleMenuClick = (menu: string) => {
        setActiveMenu(activeMenu === menu ? null : menu);
    };

    const handleItemClick = (action: () => void) => {
        action();
        setActiveMenu(null);
    };

    return (
        <div className="menu-bar" ref={menuRef}>
            <div className="menu-wrapper">
                <div className={`menu-item ${activeMenu === 'file' ? 'active' : ''}`} onClick={() => handleMenuClick('file')}>
                    {t('menu.file')}
                </div>
                {activeMenu === 'file' && (
                    <div className="dropdown-menu">
                        <div className="dropdown-item" onClick={() => handleItemClick(onNew)}>{t('menu.new')} <span className="shortcut">Ctrl+N</span></div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onOpen)}>{t('menu.open')} <span className="shortcut">Ctrl+O</span></div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onSave)}>{t('menu.save')} <span className="shortcut">Ctrl+S</span></div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onSaveAs)}>{t('menu.saveAs')}</div>
                        <div className="dropdown-divider"></div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onExportHtml)}>{t('menu.exportHtml')}</div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onPrint)}>{t('menu.print')}</div>
                        <div className="dropdown-divider"></div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onSettings)}>{t('menu.settings')}</div>
                        <div className="dropdown-divider"></div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onExit)}>{t('menu.exit')}</div>
                    </div>
                )}
            </div>

            <div className="menu-wrapper">
                <div className={`menu-item ${activeMenu === 'edit' ? 'active' : ''}`} onClick={() => handleMenuClick('edit')}>
                    {t('menu.edit')}
                </div>
                {activeMenu === 'edit' && (
                    <div className="dropdown-menu">
                        <div className="dropdown-item" onClick={() => handleItemClick(onFind)}>{t('menu.find')} <span className="shortcut">Ctrl+F</span></div>
                    </div>
                )}
            </div>

            <div className="menu-wrapper">
                <div className={`menu-item ${activeMenu === 'view' ? 'active' : ''}`} onClick={() => handleMenuClick('view')}>
                    {t('menu.view')}
                </div>
                {activeMenu === 'view' && (
                    <div className="dropdown-menu">
                        <div className="dropdown-item" onClick={() => handleItemClick(onToggleLineNumbers)}>
                            {showLineNumbers ? '✓ ' : '　'}{t('menu.lineNumbers')} <span className="shortcut">Ctrl+L</span>
                        </div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onToggleWordWrap)}>
                            {wordWrap ? '✓ ' : '　'}{t('menu.wordWrap')}
                        </div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onToggleSidebar)}>
                            {showSidebar ? '✓ ' : '　'}{t('menu.sidebar')}
                        </div>
                        <div className="dropdown-divider"></div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onToggleDarkMode)}>
                            {darkMode ? '✓ ' : '　'}{t('menu.darkMode')}
                        </div>
                    </div>
                )}
            </div>

            <div className="menu-wrapper">
                <div className={`menu-item ${activeMenu === 'help' ? 'active' : ''}`} onClick={() => handleMenuClick('help')}>
                    {t('menu.help')}
                </div>
                {activeMenu === 'help' && (
                    <div className="dropdown-menu">
                        <div className="dropdown-item" onClick={() => handleItemClick(onCheckForUpdates)}>{t('menu.checkUpdates')}</div>
                        <div className="dropdown-divider"></div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onAbout)}>{t('menu.about')}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MenuBar;
