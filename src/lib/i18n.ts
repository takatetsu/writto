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

        // Table
        'table.insert': '表を挿入',
        'table.rows': '行数',
        'table.columns': '列数',
        'table.insertTitle': '表の挿入',
        'table.cancel': 'キャンセル',
        'table.addRowAbove': '上に行を追加',
        'table.addRowBelow': '下に行を追加',
        'table.addColumnLeft': '左に列を追加',
        'table.addColumnRight': '右に列を追加',
        'table.deleteRow': '行を削除',
        'table.deleteColumn': '列を削除',

        // Context Menu - Standard
        'context.cut': '切り取り',
        'context.copy': 'コピー',
        'context.paste': '貼り付け',
        'context.selectAll': 'すべて選択',

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

        // Help Modal
        'menu.usageGuide': '使い方ガイド',
        'menu.markdownRef': 'Markdown記法',
        'help.title': '使い方ガイド',
        'help.tabUsage': '使い方',
        'help.tabMarkdown': 'Markdown記法',
        'help.close': '閉じる',
        'help.viewEditMode': '表示モード / 編集モード',
        'help.viewEditDesc': 'ダブルクリックで編集モードに入ります。Escキーで表示モードに戻ります。',
        'help.tableOps': 'テーブル操作',
        'help.tableOpsDesc': 'テーブル上で右クリックすると、行や列を追加・削除できます。',
        'help.imageInsert': '画像の挿入',
        'help.imageInsertDesc': '![代替テキスト](画像パス)と入力します。ローカル画像もURLも使用できます。',
        'help.links': 'リンク',
        'help.linksDesc': 'Ctrl+クリックでリンク先を外部ブラウザで開きます。',
        'help.shortcuts': 'キーボードショートカット',
        'help.shortcut.save': '保存',
        'help.shortcut.open': '開く',
        'help.shortcut.find': '検索',
        'help.shortcut.new': '新規作成',
        'help.shortcut.print': '印刷',
        'help.md.heading': '見出し',
        'help.md.bold': '太字',
        'help.md.italic': '斜体',
        'help.md.strike': '取り消し線',
        'help.md.code': 'インラインコード',
        'help.md.codeblock': 'コードブロック',
        'help.md.link': 'リンク',
        'help.md.image': '画像',
        'help.md.list': '箇条書き',
        'help.md.orderedList': '番号付きリスト',
        'help.md.checkbox': 'チェックボックス',
        'help.md.quote': '引用',
        'help.md.table': 'テーブル',
        'help.md.hr': '水平線',
        'help.moreInfo': '詳細はMarkdown Guideを参照',

        // Status Bar
        'status.viewMode': '表示モード',
        'status.editMode': '編集モード',
        'status.line': '行',
        'status.column': '列',
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

        // Table
        'table.insert': 'Insert Table',
        'table.rows': 'Rows',
        'table.columns': 'Columns',
        'table.insertTitle': 'Insert Table',
        'table.cancel': 'Cancel',
        'table.addRowAbove': 'Add Row Above',
        'table.addRowBelow': 'Add Row Below',
        'table.addColumnLeft': 'Add Column Left',
        'table.addColumnRight': 'Add Column Right',
        'table.deleteRow': 'Delete Row',
        'table.deleteColumn': 'Delete Column',

        // Context Menu - Standard
        'context.cut': 'Cut',
        'context.copy': 'Copy',
        'context.paste': 'Paste',
        'context.selectAll': 'Select All',

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

        // Help Modal
        'menu.usageGuide': 'Usage Guide',
        'menu.markdownRef': 'Markdown Syntax',
        'help.title': 'Usage Guide',
        'help.tabUsage': 'Usage',
        'help.tabMarkdown': 'Markdown Syntax',
        'help.close': 'Close',
        'help.viewEditMode': 'View Mode / Edit Mode',
        'help.viewEditDesc': 'Double-click to enter edit mode. Press Esc to return to view mode.',
        'help.tableOps': 'Table Operations',
        'help.tableOpsDesc': 'Right-click on a table to add or delete rows and columns.',
        'help.imageInsert': 'Insert Image',
        'help.imageInsertDesc': 'Type ![alt text](image path). Both local images and URLs work.',
        'help.links': 'Links',
        'help.linksDesc': 'Ctrl+Click to open a link in an external browser.',
        'help.shortcuts': 'Keyboard Shortcuts',
        'help.shortcut.save': 'Save',
        'help.shortcut.open': 'Open',
        'help.shortcut.find': 'Find',
        'help.shortcut.new': 'New',
        'help.shortcut.print': 'Print',
        'help.md.heading': 'Heading',
        'help.md.bold': 'Bold',
        'help.md.italic': 'Italic',
        'help.md.strike': 'Strikethrough',
        'help.md.code': 'Inline Code',
        'help.md.codeblock': 'Code Block',
        'help.md.link': 'Link',
        'help.md.image': 'Image',
        'help.md.list': 'Bullet List',
        'help.md.orderedList': 'Numbered List',
        'help.md.checkbox': 'Checkbox',
        'help.md.quote': 'Quote',
        'help.md.table': 'Table',
        'help.md.hr': 'Horizontal Rule',
        'help.moreInfo': 'See Markdown Guide for details',

        // Status Bar
        'status.viewMode': 'View Mode',
        'status.editMode': 'Edit Mode',
        'status.line': 'Line',
        'status.column': 'Col',
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
