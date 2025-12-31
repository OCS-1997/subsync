import { useRef, useEffect } from 'react';
import {
    Bold, Italic, Underline, List, ListOrdered, Link, Code,
    Heading1, Heading2, Quote, Minus, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { Button } from './button';

export function RichTextEditor({ value, onChange, placeholder = "Start writing..." }) {
    const editorRef = useRef(null);

    // Initialize editor with content
    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value || '';
        }
    }, []);

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        updateContent();
    };

    const updateContent = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const insertLink = () => {
        const url = prompt('Enter URL:');
        if (url) {
            execCommand('createLink', url);
        }
    };

    const formatButtons = [
        { icon: Heading1, label: 'Heading 1', action: () => execCommand('formatBlock', '<h1>') },
        { icon: Heading2, label: 'Heading 2', action: () => execCommand('formatBlock', '<h2>') },
        { icon: Bold, label: 'Bold (Ctrl+B)', action: () => execCommand('bold') },
        { icon: Italic, label: 'Italic (Ctrl+I)', action: () => execCommand('italic') },
        { icon: Underline, label: 'Underline (Ctrl+U)', action: () => execCommand('underline') },
        { icon: List, label: 'Bullet List', action: () => execCommand('insertUnorderedList') },
        { icon: ListOrdered, label: 'Numbered List', action: () => execCommand('insertOrderedList') },
        { icon: Link, label: 'Insert Link', action: insertLink },
        { icon: Quote, label: 'Quote', action: () => execCommand('formatBlock', '<blockquote>') },
        { icon: AlignLeft, label: 'Align Left', action: () => execCommand('justifyLeft') },
        { icon: AlignCenter, label: 'Align Center', action: () => execCommand('justifyCenter') },
        { icon: AlignRight, label: 'Align Right', action: () => execCommand('justifyRight') },
        { icon: Minus, label: 'Horizontal Line', action: () => execCommand('insertHorizontalRule') },
    ];

    return (
        <div className="space-y-2">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-800 flex-wrap sticky top-0 z-10">
                {formatButtons.map((btn, idx) => (
                    <Button
                        key={idx}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={btn.action}
                        className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                        title={btn.label}
                    >
                        <btn.icon className="w-4 h-4" />
                    </Button>
                ))}
            </div>

            {/* WYSIWYG Editor */}
            <div
                ref={editorRef}
                contentEditable
                onInput={updateContent}
                onBlur={updateContent}
                className="w-full min-h-[400px] max-h-[600px] p-4 border rounded-md overflow-y-auto focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white prose prose-sm dark:prose-invert max-w-none"
                data-placeholder={placeholder}
                style={{
                    '--placeholder-color': '#9ca3af'
                }}
                suppressContentEditableWarning
            />

            <style>{`
                [contenteditable][data-placeholder]:empty:before {
                    content: attr(data-placeholder);
                    color: var(--placeholder-color);
                    pointer-events: none;
                    position: absolute;
                }
                [contenteditable] {
                    outline: none;
                }
                [contenteditable] h1 {
                    font-size: 2em;
                    font-weight: bold;
                    margin: 0.67em 0;
                    line-height: 1.2;
                }
                [contenteditable] h2 {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin: 0.75em 0;
                    line-height: 1.3;
                }
                [contenteditable] h3 {
                    font-size: 1.17em;
                    font-weight: bold;
                    margin: 0.83em 0;
                }
                [contenteditable] p {
                    margin: 0.5em 0;
                }
                [contenteditable] blockquote {
                    border-left: 4px solid #3b82f6;
                    padding-left: 1em;
                    margin: 1em 0;
                    color: #6b7280;
                    font-style: italic;
                }
                [contenteditable] ul {
                    list-style-type: disc;
                    margin: 1em 0;
                    padding-left: 2em;
                }
                [contenteditable] ol {
                    list-style-type: decimal;
                    margin: 1em 0;
                    padding-left: 2em;
                }
                [contenteditable] li {
                    margin: 0.25em 0;
                    display: list-item;
                }
                [contenteditable] a {
                    color: #3b82f6;
                    text-decoration: underline;
                }
                [contenteditable] a:hover {
                    color: #2563eb;
                }
                [contenteditable] hr {
                    border: none;
                    border-top: 2px solid #e5e7eb;
                    margin: 1.5em 0;
                }
                [contenteditable] strong, [contenteditable] b {
                    font-weight: bold;
                }
                [contenteditable] em, [contenteditable] i {
                    font-style: italic;
                }
                [contenteditable] u {
                    text-decoration: underline;
                }
                [contenteditable] code {
                    background-color: #f3f4f6;
                    padding: 0.2em 0.4em;
                    border-radius: 3px;
                    font-family: monospace;
                    font-size: 0.9em;
                }
                /* Dark mode support */
                .dark [contenteditable] blockquote {
                    border-left-color: #60a5fa;
                    color: #9ca3af;
                }
                .dark [contenteditable] code {
                    background-color: #374151;
                }
                .dark [contenteditable] hr {
                    border-top-color: #374151;
                }
            `}</style>

            <p className="text-xs text-gray-500">
                💡 Select text and use the toolbar to format. The formatting you see is what users will see.
            </p>
        </div>
    );
}
