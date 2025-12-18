import React from 'react';

interface IconProps {
    className?: string;
}

export const FolderOpenIcon: React.FC<IconProps> = ({ className }) => (
    <span className={`sidebar-icon ${className || ''}`}>
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
        </svg>
    </span>
);

export const FolderIcon: React.FC<IconProps> = ({ className }) => (
    <span className={`sidebar-icon ${className || ''}`}>
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
        </svg>
    </span>
);

export const FolderShortcutIcon: React.FC<IconProps> = ({ className }) => (
    <span className={`sidebar-icon ${className || ''}`}>
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {/* フォルダ */}
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
            {/* ショートカット矢印（右下） */}
            <path d="M20 19l-4-4h2.5v-3h-5v2h3v1l-4-4 4-4v1h-3v4h7v3h2.5l-4 4z" fill="white" transform="translate(-6, 2) scale(0.6)" />
        </svg>
    </span>
);

export const FileIcon: React.FC<IconProps> = ({ className }) => (
    <span className={`sidebar-icon ${className || ''}`}>
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
        </svg>
    </span>
);

export const ArrowUpIcon: React.FC<IconProps> = ({ className }) => (
    <span className={`sidebar-icon ${className || ''}`}>
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 14l5-5 5 5H7z" />
        </svg>
    </span>
);

export const EditIcon: React.FC<IconProps> = ({ className }) => (
    <span className={`sidebar-icon ${className || ''}`}>
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
        </svg>
    </span>
);

export const CopyIcon: React.FC<IconProps> = ({ className }) => (
    <span className={`sidebar-icon ${className || ''}`}>
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
        </svg>
    </span>
);

export const TrashIcon: React.FC<IconProps> = ({ className }) => (
    <span className={`sidebar-icon ${className || ''}`}>
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
        </svg>
    </span>
);
