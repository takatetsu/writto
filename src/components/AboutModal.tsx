import React, { useState, useEffect } from 'react';
import { version as APP_VERSION } from '../../package.json';
import { useTranslation } from '../contexts/I18nContext';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
    darkMode: boolean;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, darkMode }) => {
    const { t, language } = useTranslation();
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (isOpen) {
            // Center the window initially
            const x = (window.innerWidth - 500) / 2;
            const y = (window.innerHeight - 400) / 2;
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

    if (!isOpen) return null;

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
                    width: '500px',
                    maxHeight: '80vh',
                    overflow: 'auto',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    border: '1px solid #ccc',
                    backgroundColor: darkMode ? '#2d2d2d' : '#fff',
                    zIndex: 2000
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
                    <span style={{ fontWeight: 'bold', fontSize: '0.9em', color: darkMode ? '#e0e0e0' : '#333' }}>{t('about.title')}</span>
                    <div
                        onClick={onClose}
                        style={{ cursor: 'pointer', padding: '0 5px', color: darkMode ? '#e0e0e0' : '#333' }}
                    >
                        &#10005;
                    </div>
                </div>

                <div style={{ padding: '30px' }}>
                    <div className="about-section">
                        <h1 className="app-name" style={{ color: darkMode ? '#e0e0e0' : '#333' }}>Writto</h1>
                        <p className="app-version" style={{ color: darkMode ? '#a0a0a0' : '#666' }}>{t('about.version')} {APP_VERSION}</p>
                    </div>

                    <div className="about-section">
                        <p className="copyright" style={{ color: darkMode ? '#a0a0a0' : '#666' }}>© 2025 takahashi.tetsuya</p>
                        <p className="license" style={{ color: darkMode ? '#a0a0a0' : '#666' }}>
                            <strong>{language === 'ja' ? 'ライセンス' : 'License'}:</strong> MIT License
                        </p>
                        <p style={{ color: darkMode ? '#a0a0a0' : '#666', fontSize: '0.9em' }}>
                            <strong>GitHub:</strong> https://github.com/takatetsu/writto
                        </p>
                    </div>

                    <div className="about-section development-info" style={{
                        marginTop: '30px',
                        paddingTop: '20px',
                        borderTop: `1px solid ${darkMode ? '#555' : '#eee'}`
                    }}>
                        <p className="development-title" style={{ color: darkMode ? '#e0e0e0' : '#333' }}>
                            <strong>{language === 'ja' ? '開発について' : 'About Development'}</strong>
                        </p>
                        {language === 'ja' ? (
                            <>
                                <p className="development-text" style={{ color: darkMode ? '#a0a0a0' : '#666' }}>
                                    このアプリケーションは <strong>Antigravity</strong> を使用し <strong>VibeCoding</strong> で開発されました。
                                </p>
                                <p className="development-text" style={{ color: darkMode ? '#a0a0a0' : '#666' }}>
                                    開発者は1行もコードを手書きしていません。
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="development-text" style={{ color: darkMode ? '#a0a0a0' : '#666' }}>
                                    This application was developed using <strong>Antigravity</strong> with <strong>VibeCoding</strong>.
                                </p>
                                <p className="development-text" style={{ color: darkMode ? '#a0a0a0' : '#666' }}>
                                    Zero lines of code were written manually by the developer.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutModal;
