// Translation data and i18n utilities

export type Language = 'ja' | 'en';

export const translations = {
    ja: {
        // Menu - File
        'menu.file': 'ファイル',
        'menu.new': '新規作成',
        'menu.open': '開く...',
        'menu.save': '保存',
        'menu.saveAs': '名前を付けて保存...',
        'menu.exportHtml': 'HTMLとしてエクスポート',
        'menu.print': '印刷...',
        'menu.settings': '設定...',
        'menu.exit': '終了',

        // Menu - Edit
        'menu.edit': '編集',
        'menu.find': '検索...',

        // Menu - View
        'menu.view': '表示',
        'menu.lineNumbers': '行番号表示',
        'menu.wordWrap': '行の折り返し',
        'menu.sidebar': 'サイドバー表示',
        'menu.darkMode': 'ダークモード',

        // Menu - Help
        'menu.help': 'ヘルプ',
        'menu.checkUpdates': '更新の確認...',
        'menu.about': 'バージョン情報',

        // Settings Modal
        'settings.title': '設定',
        'settings.fontSize': 'フォントサイズ',
        'settings.fontFamily': 'フォントファミリー',
        'settings.editorWidth': 'エディタ幅',
        'settings.language': '言語',
        'settings.resetSettings': '設定をリセット',
        'settings.startupFolder': '起動時に開くフォルダ',
        'settings.selectFolder': 'フォルダを選択...',
        'settings.clear': 'クリア',
        'settings.close': '閉じる',

        // About Modal
        'about.title': 'バージョン情報',
        'about.version': 'バージョン',
        'about.close': '閉じる',

        // Dialogs
        'dialog.unsavedChanges': '保存されていない変更があります。破棄しますか?',
        'dialog.confirmDelete': '削除しますか？',
        'dialog.newFolder': '新しいフォルダ',
        'dialog.newFile': '新しいファイル.md',
        'dialog.rename': '名前を変更',

        // Context Menu
        'context.newFolder': '新しいフォルダ',
        'context.newFile': '新しいファイル',
        'context.rename': '名前を変更',
        'context.delete': '削除',
        'context.duplicate': '複製',

        // Link Widget
        'link.ctrlClick': 'Ctrl+クリックでリンク先へ移動',

        // Code Block
        'codeblock.copy': 'コピー',
        'codeblock.copied': 'コピー完了！',
        'codeblock.copyTooltip': 'コードをクリップボードにコピー',
        'codeblock.error': 'エラー',

        // Update Dialog
        'update.available': '新しいバージョンが利用可能です',
        'update.current': '現在のバージョン',
        'update.latest': '最新バージョン',
        'update.download': 'ダウンロード',
        'update.later': '後で',
        'update.upToDate': '最新バージョンです',

        // Errors
        'error.loadFile': 'ファイルの読み込みに失敗しました',
        'error.saveFile': 'ファイルの保存に失敗しました',
    },
    en: {
        // Menu - File
        'menu.file': 'File',
        'menu.new': 'New',
        'menu.open': 'Open...',
        'menu.save': 'Save',
        'menu.saveAs': 'Save As...',
        'menu.exportHtml': 'Export as HTML',
        'menu.print': 'Print...',
        'menu.settings': 'Settings...',
        'menu.exit': 'Exit',

        // Menu - Edit
        'menu.edit': 'Edit',
        'menu.find': 'Find...',

        // Menu - View
        'menu.view': 'View',
        'menu.lineNumbers': 'Line Numbers',
        'menu.wordWrap': 'Word Wrap',
        'menu.sidebar': 'Sidebar',
        'menu.darkMode': 'Dark Mode',

        // Menu - Help
        'menu.help': 'Help',
        'menu.checkUpdates': 'Check for Updates...',
        'menu.about': 'About',

        // Settings Modal
        'settings.title': 'Settings',
        'settings.fontSize': 'Font Size',
        'settings.fontFamily': 'Font Family',
        'settings.editorWidth': 'Editor Width',
        'settings.language': 'Language',
        'settings.resetSettings': 'Reset Settings',
        'settings.startupFolder': 'Startup Folder',
        'settings.selectFolder': 'Select Folder...',
        'settings.clear': 'Clear',
        'settings.close': 'Close',

        // About Modal
        'about.title': 'About',
        'about.version': 'Version',
        'about.close': 'Close',

        // Dialogs
        'dialog.unsavedChanges': 'You have unsaved changes. Discard them?',
        'dialog.confirmDelete': 'Are you sure you want to delete?',
        'dialog.newFolder': 'New Folder',
        'dialog.newFile': 'New File.md',
        'dialog.rename': 'Rename',

        // Context Menu
        'context.newFolder': 'New Folder',
        'context.newFile': 'New File',
        'context.rename': 'Rename',
        'context.delete': 'Delete',
        'context.duplicate': 'Duplicate',

        // Link Widget
        'link.ctrlClick': 'Ctrl+Click to follow link',

        // Code Block
        'codeblock.copy': 'Copy',
        'codeblock.copied': 'Copied!',
        'codeblock.copyTooltip': 'Copy code to clipboard',
        'codeblock.error': 'Error',

        // Update Dialog
        'update.available': 'A new version is available',
        'update.current': 'Current version',
        'update.latest': 'Latest version',
        'update.download': 'Download',
        'update.later': 'Later',
        'update.upToDate': 'You are up to date',

        // Errors
        'error.loadFile': 'Failed to load file',
        'error.saveFile': 'Failed to save file',
    }
} as const;

export type TranslationKey = keyof typeof translations.ja;

// Detect system language
export function detectLanguage(): Language {
    const lang = navigator.language.split('-')[0];
    if (lang === 'ja') {
        return 'ja';
    }
    return 'en'; // Default to English for unsupported languages
}

// Get saved language or detect from system
export function getInitialLanguage(): Language {
    const saved = localStorage.getItem('language');
    if (saved === 'ja' || saved === 'en') {
        return saved;
    }
    return detectLanguage();
}

// Save language preference
export function saveLanguage(lang: Language): void {
    localStorage.setItem('language', lang);
}

// Get translation
export function t(lang: Language, key: TranslationKey): string {
    return translations[lang][key] || key;
}
