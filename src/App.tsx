import { useState, useEffect, useRef, useMemo } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { marked } from 'marked';
import Editor, { EditorHandle } from './components/Editor';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import { openFile, saveFile, saveFileAs, readFileContent } from './lib/fs';
import { exportHtml } from './lib/export';
import './App.css';

import MenuBar from './components/MenuBar';

function App() {
  const [doc, setDoc] = useState<string>('');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [printContent, setPrintContent] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    fontSize: 14,
    fontFamily: 'Consolas, monospace',
    defaultFolderMode: 'none' as 'none' | 'specific' | 'last',
    defaultFolderPath: ''
  });
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  const editorRef = useRef<EditorHandle>(null);
  const isLoading = useRef(false);

  const appWindow = getCurrentWindow();

  // Helper function to get directory from file path
  const getDirectoryFromPath = (path: string | null): string | undefined => {
    if (!path) return undefined;
    const separator = path.includes('\\') ? '\\' : '/';
    const lastSeparatorIndex = path.lastIndexOf(separator);
    if (lastSeparatorIndex === -1) return undefined;
    return path.substring(0, lastSeparatorIndex);
  };

  // Calculate activeFileDir from filePath
  const activeFileDir = useMemo(() => {
    return getDirectoryFromPath(filePath);
  }, [filePath]);

  // State for initial folder to open
  const [initialFolder, setInitialFolder] = useState<string | undefined>(undefined);

  const handleDocChange = (newDoc: string) => {
    setDoc(newDoc);
    if (!isLoading.current) {
      setIsDirty(true);
    }
  };

  const handleNavigate = (line: number) => {
    if (editorRef.current) {
      editorRef.current.scrollToLine(line);
    }
  };

  const handleFind = () => {
    if (editorRef.current) {
      editorRef.current.triggerSearch();
    }
  };

  const handleToggleLineNumbers = () => {
    setShowLineNumbers(prev => !prev);
  };

  const handleToggleWordWrap = () => {
    setWordWrap(prev => !prev);
  };

  const handleToggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };

  const handleToggleDarkMode = () => {
    setDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('darkMode', String(newValue));
      return newValue;
    });
  };

  const handleNew = async () => {
    if (isDirty) {
      if (!(await confirm('保存されていない変更があります。破棄しますか?'))) return;
    }
    setDoc('');
    setFilePath(null);
    setIsDirty(false);
  };

  const handleOpen = async () => {
    if (isDirty) {
      if (!(await confirm('保存されていない変更があります。破棄しますか?'))) return;
    }
    const result = await openFile();
    if (result) {
      isLoading.current = true;
      setDoc(result.content);
      setFilePath(result.path);
      setIsDirty(false);
      setTimeout(() => {
        isLoading.current = false;
      }, 100);
    }
  };

  const handleSave = async () => {
    if (filePath) {
      const success = await saveFile(filePath, doc);
      if (success) setIsDirty(false);
    } else {
      handleSaveAs();
    }
  };

  const handleSaveAs = async () => {
    const result = await saveFileAs(doc);
    if (result) {
      setFilePath(result.path);
      setIsDirty(false);
    }
  };

  const handleFileSelect = async (path: string) => {
    console.log('handleFileSelect called with path:', path);
    console.log('Current filePath:', filePath);
    console.log('isDirty:', isDirty);

    // Don't switch if clicking the same file
    if (path === filePath) {
      console.log('Same file clicked, returning');
      return;
    }

    if (isDirty) {
      console.log('File is dirty, showing confirm dialog');
      const userConfirmed = await confirm('保存されていない変更があります。破棄しますか?');
      console.log('User confirmed:', userConfirmed);
      if (!userConfirmed) {
        console.log('User cancelled, returning without changes');
        return;
      }
    }

    console.log('Reading file content...');
    const content = await readFileContent(path);
    console.log('File content read, length:', content?.length);

    if (content !== null) {
      isLoading.current = true;
      console.log('Updating state with new file content');
      setDoc(content);
      setFilePath(path);
      setIsDirty(false);
      setTimeout(() => {
        isLoading.current = false;
      }, 100);

      // Save last used folder
      const dir = getDirectoryFromPath(path);
      if (dir) {
        localStorage.setItem('lastUsedFolder', dir);
      }
    }
    console.log('handleFileSelect completed');
  };

  const handleExportHtml = async () => {
    await exportHtml(doc);
  };

  const handlePrint = async () => {
    const html = await marked(doc);
    setPrintContent(html);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = (newSettings: { fontSize: number; fontFamily: string; defaultFolderMode: 'none' | 'specific' | 'last'; defaultFolderPath: string }) => {
    console.log('Saving settings:', newSettings);
    setSettings(newSettings);
    localStorage.setItem('editorSettings', JSON.stringify(newSettings));
    console.log('Settings saved to localStorage');
  };

  // Load settings and determine initial folder
  useEffect(() => {
    const saved = localStorage.getItem('editorSettings');
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        setSettings({
          fontSize: parsedSettings.fontSize || 14,
          fontFamily: parsedSettings.fontFamily || 'Consolas, monospace',
          defaultFolderMode: parsedSettings.defaultFolderMode || 'none',
          defaultFolderPath: parsedSettings.defaultFolderPath || ''
        });

        // Determine which folder to open on startup
        if (parsedSettings.defaultFolderMode === 'specific' && parsedSettings.defaultFolderPath) {
          setInitialFolder(parsedSettings.defaultFolderPath);
        } else if (parsedSettings.defaultFolderMode === 'last') {
          const lastFolder = localStorage.getItem('lastUsedFolder');
          if (lastFolder) {
            setInitialFolder(lastFolder);
          }
        }
      } catch (e) { console.error(e); }
    }
  }, []);

  // Window controls
  const minimize = () => appWindow.minimize();
  const toggleMaximize = async () => {
    const isMaximized = await appWindow.isMaximized();
    if (isMaximized) {
      appWindow.unmaximize();
    } else {
      appWindow.maximize();
    }
  };
  const close = () => appWindow.close();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'o':
            e.preventDefault();
            handleOpen();
            break;
          case 'n':
            e.preventDefault();
            handleNew();
            break;
          case 'f':
            e.preventDefault();
            handleFind();
            break;
          case 'l':
            e.preventDefault();
            handleToggleLineNumbers();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [doc, filePath, isDirty, showLineNumbers, wordWrap]);

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
      <div id="print-container" dangerouslySetInnerHTML={{ __html: printContent }} />
      <div className="title-bar">
        <MenuBar
          onNew={handleNew}
          onOpen={handleOpen}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onExportHtml={handleExportHtml}
          onPrint={handlePrint}
          onSettings={handleSettings}
          onFind={handleFind}
          showLineNumbers={showLineNumbers}
          onToggleLineNumbers={handleToggleLineNumbers}
          wordWrap={wordWrap}
          onToggleWordWrap={handleToggleWordWrap}
          showSidebar={showSidebar}
          onToggleSidebar={handleToggleSidebar}
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
        <div className="window-title">
          {filePath ? filePath : 'Untitled'} {isDirty ? '*' : ''} - Writto
        </div>
        <div className="window-controls">
          <div className="window-control" onClick={minimize}>&#9472;</div>
          <div className="window-control" onClick={toggleMaximize}>&#9633;</div>
          <div className="window-control close" onClick={close}>&#10005;</div>
        </div>
      </div>
      <div className="main-content">
        {showSidebar && (
          <Sidebar
            doc={doc}
            onNavigate={handleNavigate}
            onFileSelect={handleFileSelect}
            activeFileDir={activeFileDir || initialFolder}
            currentFilePath={filePath}
          />
        )}
        <div className="editor-container">
          <Editor
            ref={editorRef}
            initialDoc={doc}
            onChange={handleDocChange}
            settings={settings}
            showLineNumbers={showLineNumbers}
            wordWrap={wordWrap}
            activeFileDir={activeFileDir || initialFolder}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
