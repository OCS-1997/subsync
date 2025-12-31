import { useRef, useEffect, useState } from 'react';
import {
    Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link, Code,
    Heading1, Heading2, Heading3, Quote, Minus, AlignLeft, AlignCenter, AlignRight,
    Highlighter, Type, Trash2, Image as ImageIcon, Subscript, Superscript, Indent, Outdent,
    Type as FontColorIcon, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

const COLORS = [
    { name: 'Default', value: 'inherit' },
    { name: 'Black', value: '#000000' },
    { name: 'Slate', value: '#64748b' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Rose', value: '#f43f5e' },
];

const HIGHLIGHTS = [
    { name: 'None', value: 'transparent' },
    { name: 'Black', value: '#000000' },
    { name: 'Yellow', value: '#fef08a' },
    { name: 'Green', value: '#bbf7d0' },
    { name: 'Blue', value: '#bfdbfe' },
    { name: 'Pink', value: '#fbcfe8' },
    { name: 'Orange', value: '#fed7aa' },
    { name: 'Slate', value: '#f1f5f9' },
];

export function RichTextEditor({ value, onChange, placeholder = "Start writing..." }) {
    const editorRef = useRef(null);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
    const [dialogUrl, setDialogUrl] = useState('');

    const [activeStates, setActiveStates] = useState({
        bold: false,
        italic: false,
        underline: false,
        strikeThrough: false,
        justifyLeft: false,
        justifyCenter: false,
        justifyRight: false,
        insertUnorderedList: false,
        insertOrderedList: false,
        subscript: false,
        superscript: false,
        h1: false,
        h2: false,
        h3: false,
        blockquote: false,
        pre: false
    });

    const updateActiveStates = () => {
        if (!editorRef.current) return;

        const checkCommand = (cmd) => document.queryCommandState(cmd);
        const checkValue = (cmd, val) => {
            const currentVal = document.queryCommandValue(cmd);
            return currentVal === val || currentVal === `<${val}>` || currentVal === val.toLowerCase();
        };

        const selection = window.getSelection();
        if (!selection || !editorRef.current.contains(selection.anchorNode)) return;

        setActiveStates({
            bold: checkCommand('bold'),
            italic: checkCommand('italic'),
            underline: checkCommand('underline'),
            strikeThrough: checkCommand('strikeThrough'),
            justifyLeft: checkCommand('justifyLeft'),
            justifyCenter: checkCommand('justifyCenter'),
            justifyRight: checkCommand('justifyRight'),
            insertUnorderedList: checkCommand('insertUnorderedList'),
            insertOrderedList: checkCommand('insertOrderedList'),
            subscript: checkCommand('subscript'),
            superscript: checkCommand('superscript'),
            h1: document.queryCommandValue('formatBlock') === 'h1',
            h2: document.queryCommandValue('formatBlock') === 'h2',
            h3: document.queryCommandValue('formatBlock') === 'h3',
            blockquote: document.queryCommandValue('formatBlock') === 'blockquote',
            pre: document.queryCommandValue('formatBlock') === 'pre'
        });
    };

    useEffect(() => {
        const handleSelectionChange = () => {
            updateActiveStates();
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, []);

    // Initialize editor with content
    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value || '';
        }
    }, []);

    const execCommand = (command, value = null) => {
        if (command === 'hiliteColor') {
            // Try hiliteColor first, fallback to backColor for browser compatibility
            try {
                if (!document.execCommand('hiliteColor', false, value)) {
                    document.execCommand('backColor', false, value);
                }
            } catch (e) {
                document.execCommand('backColor', false, value);
            }
        } else if (command === 'foreColor' && value === 'inherit') {
            // Revert to initial color (theme default)
            document.execCommand('foreColor', false, 'initial');
        } else {
            document.execCommand(command, false, value);
        }
        editorRef.current?.focus();
        updateContent();
    };

    const handleKeyDown = (e) => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        let container = range.commonAncestorContainer;
        if (container.nodeType === 3) container = container.parentNode;

        const pre = container.closest('pre');
        const blockquote = container.closest('blockquote');

        // Handle Tab in code blocks
        if (e.key === 'Tab') {
            if (pre) {
                e.preventDefault();
                document.execCommand('insertText', false, '    '); // 4 spaces
                return;
            }
        }

        // Handle Enter in code blocks
        if (e.key === 'Enter') {
            if (pre) {
                e.preventDefault();
                // Check if we should breakout (Shift+Enter or empty line at end?)
                // For now, consistent multiline support:
                const newline = document.createTextNode('\n');
                range.insertNode(newline);
                range.setStartAfter(newline);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);

                // Ensure selection is visible
                const span = document.createElement('span');
                range.insertNode(span);
                span.scrollIntoView({ block: 'nearest' });
                span.remove();

                updateContent();
                return;
            }
        }

        // Markdown transformation: ``` + Space/Enter
        if (e.key === ' ' || e.key === 'Enter') {
            const node = range.startContainer;
            if (node.nodeType === 3) {
                const textBefore = node.textContent.substring(0, range.startOffset);
                const match = textBefore.match(/^(?:>|#{1,3}|```(\w+)?)$/);

                if (match) {
                    const fullMatch = match[0];
                    const lang = match[1];

                    // Code Block trigger
                    if (fullMatch.startsWith('```')) {
                        e.preventDefault();
                        node.textContent = node.textContent.substring(range.startOffset);
                        execCommand('formatBlock', '<pre>');

                        if (lang) {
                            setTimeout(() => {
                                const sel = window.getSelection();
                                if (sel && sel.anchorNode) {
                                    const newPre = (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentNode : sel.anchorNode).closest('pre');
                                    if (newPre) {
                                        newPre.className = `language-${lang} p-6 bg-[#1e293b] text-[#f8fafc] rounded-xl font-mono text-sm my-4 block`;
                                        newPre.setAttribute('data-language', lang);
                                    }
                                }
                            }, 0);
                        }
                        return;
                    }
                }
            }
        }
    };

    const updateContent = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleInsertLink = () => {
        if (dialogUrl) {
            execCommand('createLink', dialogUrl);
        }
        setIsLinkDialogOpen(false);
        setDialogUrl('');
    };

    const handleInsertImage = () => {
        if (dialogUrl) {
            execCommand('insertImage', dialogUrl);
        }
        setIsImageDialogOpen(false);
        setDialogUrl('');
    };

    const toolbarGroups = [
        {
            name: 'Headings',
            buttons: [
                { icon: Heading1, label: 'Heading 1', action: () => execCommand('formatBlock', '<h1>'), active: activeStates.h1 },
                { icon: Heading2, label: 'Heading 2', action: () => execCommand('formatBlock', '<h2>'), active: activeStates.h2 },
                { icon: Heading3, label: 'Heading 3', action: () => execCommand('formatBlock', '<h3>'), active: activeStates.h3 },
            ]
        },
        {
            name: 'Text',
            buttons: [
                { icon: Bold, label: 'Bold', action: () => execCommand('bold'), active: activeStates.bold },
                { icon: Italic, label: 'Italic', action: () => execCommand('italic'), active: activeStates.italic },
                { icon: Underline, label: 'Underline', action: () => execCommand('underline'), active: activeStates.underline },
                { icon: Strikethrough, label: 'Strikethrough', action: () => execCommand('strikeThrough'), active: activeStates.strikeThrough },
            ]
        },
        {
            name: 'Script',
            buttons: [
                { icon: Subscript, label: 'Subscript', action: () => execCommand('subscript'), active: activeStates.subscript },
                { icon: Superscript, label: 'Superscript', action: () => execCommand('superscript'), active: activeStates.superscript },
            ]
        },
        {
            name: 'List',
            buttons: [
                { icon: List, label: 'Bullet List', action: () => execCommand('insertUnorderedList'), active: activeStates.insertUnorderedList },
                { icon: ListOrdered, label: 'Numbered List', action: () => execCommand('insertOrderedList'), active: activeStates.insertOrderedList },
            ]
        },
        {
            name: 'Indent',
            buttons: [
                { icon: Outdent, label: 'Outdent', action: () => execCommand('outdent') },
                { icon: Indent, label: 'Indent', action: () => execCommand('indent') },
            ]
        },
        {
            name: 'Alignment',
            buttons: [
                { icon: AlignLeft, label: 'Align Left', action: () => execCommand('justifyLeft'), active: activeStates.justifyLeft },
                { icon: AlignCenter, label: 'Align Center', action: () => execCommand('justifyCenter'), active: activeStates.justifyCenter },
                { icon: AlignRight, label: 'Align Right', action: () => execCommand('justifyRight'), active: activeStates.justifyRight },
            ]
        },
        {
            name: 'Color',
            type: 'special',
            buttons: [
                {
                    icon: FontColorIcon,
                    label: 'Text Color',
                    component: (
                        <Popover key="text-color">
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                >
                                    <FontColorIcon className="w-4 h-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-2 grid grid-cols-4 gap-1">
                                {COLORS.map((c) => (
                                    <button
                                        key={c.name}
                                        onClick={() => execCommand('foreColor', c.value)}
                                        className="w-7 h-7 rounded-md border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: c.value === 'inherit' ? 'transparent' : c.value }}
                                        title={c.name}
                                    >
                                        {c.value === 'inherit' && <X className="w-4 h-4 mx-auto text-gray-400" />}
                                    </button>
                                ))}
                            </PopoverContent>
                        </Popover>
                    )
                },
                {
                    icon: Highlighter,
                    label: 'Highlight',
                    component: (
                        <Popover key="bg-color">
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                >
                                    <Highlighter className="w-4 h-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-32 p-2 grid grid-cols-4 gap-1">
                                {HIGHLIGHTS.map((c) => (
                                    <button
                                        key={c.name}
                                        onClick={() => execCommand('hiliteColor', c.value)}
                                        className="w-6 h-6 rounded-md border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: c.value }}
                                        title={c.name}
                                    >
                                        {c.value === 'transparent' && <X className="w-3 h-3 mx-auto text-gray-400" />}
                                    </button>
                                ))}
                            </PopoverContent>
                        </Popover>
                    )
                },
            ]
        },
        {
            name: 'Insert',
            buttons: [
                { icon: Link, label: 'Link', action: () => setIsLinkDialogOpen(true) },
                { icon: ImageIcon, label: 'Image', action: () => setIsImageDialogOpen(true) },
                { icon: Quote, label: 'Quote', action: () => execCommand('formatBlock', '<blockquote>'), active: activeStates.blockquote },
                { icon: Code, label: 'Code Block', action: () => execCommand('formatBlock', '<pre>'), active: activeStates.pre },
                { icon: Minus, label: 'Horizontal Line', action: () => execCommand('insertHorizontalRule') },
            ]
        },
        {
            name: 'Action',
            buttons: [
                { icon: Trash2, label: 'Clear Format', action: () => execCommand('removeFormat') },
            ]
        }
    ];

    return (
        <TooltipProvider>
            <div className="space-y-2 group/editor">
                {/* Toolbar */}
                <div className="flex items-center gap-1 p-1.5 border rounded-xl bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-sm flex-wrap sticky top-0 z-20 transition-all border-gray-200 dark:border-gray-700">
                    {toolbarGroups.map((group, gIdx) => (
                        <div key={gIdx} className="flex items-center gap-0.5 border-r border-gray-200 dark:border-gray-700 pr-1 mr-1 last:border-0 last:pr-0 last:mr-0">
                            {group.buttons.map((btn, idx) => {
                                if (btn.component) return btn.component;

                                return (
                                    <Tooltip key={idx} delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={btn.action}
                                                className={cn(
                                                    "h-8 w-8 p-0 transition-colors",
                                                    btn.active
                                                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                                                        : "hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                                )}
                                            >
                                                <btn.icon className="w-4 h-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-[10px] uppercase font-bold tracking-wider">
                                            {btn.label}
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Dialogs for Link and Image */}
                <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Insert Hyperlink</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="link-url">URL Address</Label>
                                <Input
                                    id="link-url"
                                    placeholder="https://example.com"
                                    value={dialogUrl}
                                    onChange={(e) => setDialogUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleInsertLink()}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleInsertLink}>Insert Link</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Insert Image</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="image-url">Image URL</Label>
                                <Input
                                    id="image-url"
                                    placeholder="https://example.com/image.png"
                                    value={dialogUrl}
                                    onChange={(e) => setDialogUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleInsertImage()}
                                />
                                <p className="text-[10px] text-gray-500 italic">Paste a public image URL to embed it in the article.</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleInsertImage}>Embed Image</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* WYSIWYG Editor */}
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={updateContent}
                    onBlur={updateContent}
                    onKeyUp={updateActiveStates}
                    onMouseUp={updateActiveStates}
                    onKeyDown={handleKeyDown}
                    className="w-full min-h-[400px] max-h-[1000px] p-8 border rounded-2xl overflow-y-auto focus:outline-none focus:ring-4 focus:ring-blue-500/10 bg-white dark:bg-[#0f172a]/50 border-gray-200 dark:border-gray-800 dark:text-gray-100 prose prose-blue dark:prose-invert max-w-none transition-all shadow-xl scrollbar-thin"
                    data-placeholder={placeholder}
                    suppressContentEditableWarning
                ></div>

                <style>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #94a3b8;
                    font-style: italic;
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
                    font-size: 1.25em;
                    font-weight: bold;
                    margin: 0.83em 0;
                    line-height: 1.4;
                    color: #1e293b;
                }
                [contenteditable] p {
                    margin: 1em 0;
                    line-height: 1.6;
                }
                [contenteditable] blockquote {
                    border-left: 4px solid #3b82f6;
                    padding: 0.5em 1.5em;
                    margin: 1.5em 0;
                    background: #f8fafc;
                    color: #475569;
                    font-style: italic;
                    border-radius: 0 0.5rem 0.5rem 0;
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
                    margin: 0.5em 0;
                }
                [contenteditable] a {
                    color: #3b82f6;
                    text-decoration: underline;
                    font-weight: 500;
                }
                [contenteditable] a:hover {
                    color: #2563eb;
                }
                [contenteditable] hr {
                    border: none;
                    border-top: 2px solid #f1f5f9;
                    margin: 2em 0;
                }
                [contenteditable] pre {
                    background-color: #1e293b;
                    color: #f8fafc;
                    padding: 1.5em;
                    border-radius: 0.75rem;
                    font-family: 'JetBrains Mono', 'Fira Code', monospace;
                    font-size: 0.875em;
                    overflow-x: auto;
                    margin: 1.5em 0;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    line-height: 1.7;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                [contenteditable] pre + pre {
                    margin-top: -1.4em;
                    border-top-left-radius: 0;
                    border-top-right-radius: 0;
                }
                [contenteditable] code {
                    background-color: rgba(225, 29, 72, 0.05);
                }
                [contenteditable] img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 1rem;
                    margin: 2em auto;
                    display: block;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }
                [contenteditable] sub {
                    font-size: 0.75em;
                    bottom: -0.25em;
                }
                [contenteditable] sup {
                    font-size: 0.75em;
                    top: -0.5em;
                }
                /* Dark mode support */
                .dark [contenteditable] h3 {
                    color: #f1f5f9;
                }
                .dark [contenteditable] blockquote {
                    background: #1e293b;
                    color: #cbd5e1;
                    border-left-color: #60a5fa;
                }
                .dark [contenteditable] code {
                    background-color: #334155;
                    color: #fb7185;
                }
                .dark [contenteditable] pre {
                    background-color: #0f172a;
                }
                .dark [contenteditable] hr {
                    border-top-color: #334155;
                }
            `}</style>

                <p className="text-xs text-gray-500">
                    💡 Select text and use the toolbar to format. The formatting you see is what users will see.
                </p>
            </div>
        </TooltipProvider >
    );
}
