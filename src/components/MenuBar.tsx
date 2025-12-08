import React, { useState, useEffect, useRef } from 'react';

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
}

const MenuBar: React.FC<MenuBarProps> = ({
    onNew, onOpen, onSave, onSaveAs, onExportHtml, onPrint, onSettings, onFind, showLineNumbers, onToggleLineNumbers, wordWrap, onToggleWordWrap, showSidebar, onToggleSidebar, darkMode, onToggleDarkMode, onAbout, onCheckForUpdates
}) => {
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
                    ファイル
                </div>
                {activeMenu === 'file' && (
                    <div className="dropdown-menu">
                        <div className="dropdown-item" onClick={() => handleItemClick(onNew)}>新規作成 <span className="shortcut">Ctrl+N</span></div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onOpen)}>開く... <span className="shortcut">Ctrl+O</span></div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onSave)}>保存 <span className="shortcut">Ctrl+S</span></div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onSaveAs)}>名前を付けて保存...</div>
                        <div className="dropdown-divider"></div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onExportHtml)}>HTMLとしてエクスポート</div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onPrint)}>印刷...</div>
                        <div className="dropdown-divider"></div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onSettings)}>設定...</div>
                        <div className="dropdown-divider"></div>
                        <div className="dropdown-item" onClick={() => window.close()}>終了</div>
                    </div>
                )}
            </div>

            <div className="menu-wrapper">
                <div className={`menu-item ${activeMenu === 'edit' ? 'active' : ''}`} onClick={() => handleMenuClick('edit')}>
                    編集
                </div>
                {activeMenu === 'edit' && (
                    <div className="dropdown-menu">
                        <div className="dropdown-item" onClick={() => handleItemClick(onFind)}>検索... <span className="shortcut">Ctrl+F</span></div>
                    </div>
                )}
            </div>

            <div className="menu-wrapper">
                <div className={`menu-item ${activeMenu === 'view' ? 'active' : ''}`} onClick={() => handleMenuClick('view')}>
                    表示
                </div>
                {activeMenu === 'view' && (
                    <div className="dropdown-menu">
                        <div className="dropdown-item" onClick={() => handleItemClick(onToggleLineNumbers)}>
                            {showLineNumbers ? '✓ ' : '　'}行番号表示 <span className="shortcut">Ctrl+L</span>
                        </div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onToggleWordWrap)}>
                            {wordWrap ? '✓ ' : '　'}行の折り返し
                        </div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onToggleSidebar)}>
                            {showSidebar ? '✓ ' : '　'}サイドバー表示
                        </div>
                        <div className="dropdown-divider"></div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onToggleDarkMode)}>
                            {darkMode ? '✓ ' : '　'}ダークモード
                        </div>
                    </div>
                )}
            </div>

            <div className="menu-wrapper">
                <div className={`menu-item ${activeMenu === 'help' ? 'active' : ''}`} onClick={() => handleMenuClick('help')}>
                    ヘルプ
                </div>
                {activeMenu === 'help' && (
                    <div className="dropdown-menu">
                        <div className="dropdown-item" onClick={() => handleItemClick(onCheckForUpdates)}>更新の確認...</div>
                        <div className="dropdown-divider"></div>
                        <div className="dropdown-item" onClick={() => handleItemClick(onAbout)}>バージョン情報</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MenuBar;
