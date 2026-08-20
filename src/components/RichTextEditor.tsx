import { useRef, useEffect, useCallback } from "react";
import { useTheme } from "../theme";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Code,
  Quote,
  Undo,
  Redo,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your message...",
  minHeight = 160,
  className = "",
  style,
}: RichTextEditorProps) {
  const { tokens: t } = useTheme();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const isInternalChange = useRef(false);

  // Set initial content when value changes externally (e.g. saved reply insertion)
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      const current = editorRef.current.innerHTML;
      if (value !== current) {
        editorRef.current.innerHTML = value || "";
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const exec = useCallback((command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl/Cmd+B, I, U for formatting
    if (e.metaKey || e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          exec("bold");
          break;
        case "i":
          e.preventDefault();
          exec("italic");
          break;
        case "u":
          e.preventDefault();
          exec("underline");
          break;
        case "k":
          e.preventDefault();
          handleLink();
          break;
      }
    }
  }, [exec]);

  function handleLink() {
    const url = window.prompt("Enter URL:");
    if (url) {
      exec("createLink", url);
    }
  }

  function insertCodeBlock() {
    const selection = window.getSelection();
    const text = selection?.toString() || "";
    if (editorRef.current) {
      const code = text || "code here";
      document.execCommand("insertHTML", false, `<pre><code>${escapeHtml(code)}</code></pre><p></p>`);
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }

  const toolbarBtn = (onClick: () => void, icon: React.ReactNode, title: string) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="p-1.5 rounded-md transition-colors hover:opacity-80"
      style={{ color: t.textSub }}
      title={title}
    >
      {icon}
    </button>
  );

  const divider = (
    <div className="w-px h-5 mx-1" style={{ backgroundColor: t.divider }} />
  );

  return (
    <div
      className={`rounded-xl overflow-hidden flex flex-col ${className}`}
      style={{
        backgroundColor: t.inputBg,
        border: `1px solid ${t.inputBorder}`,
        ...style,
      }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b"
        style={{ borderColor: t.divider, backgroundColor: t.readTopBg }}
      >
        {toolbarBtn(() => exec("bold"), <Bold className="w-3.5 h-3.5" />, "Bold (Ctrl+B)")}
        {toolbarBtn(() => exec("italic"), <Italic className="w-3.5 h-3.5" />, "Italic (Ctrl+I)")}
        {toolbarBtn(() => exec("underline"), <Underline className="w-3.5 h-3.5" />, "Underline (Ctrl+U)")}
        {toolbarBtn(() => exec("strikeThrough"), <Strikethrough className="w-3.5 h-3.5" />, "Strikethrough")}
        {divider}
        {toolbarBtn(() => exec("insertUnorderedList"), <List className="w-3.5 h-3.5" />, "Bullet list")}
        {toolbarBtn(() => exec("insertOrderedList"), <ListOrdered className="w-3.5 h-3.5" />, "Numbered list")}
        {divider}
        {toolbarBtn(() => exec("formatBlock", "<blockquote>"), <Quote className="w-3.5 h-3.5" />, "Quote")}
        {toolbarBtn(insertCodeBlock, <Code className="w-3.5 h-3.5" />, "Code block")}
        {toolbarBtn(handleLink, <LinkIcon className="w-3.5 h-3.5" />, "Insert link (Ctrl+K)")}
        {divider}
        {toolbarBtn(() => exec("undo"), <Undo className="w-3.5 h-3.5" />, "Undo")}
        {toolbarBtn(() => exec("redo"), <Redo className="w-3.5 h-3.5" />, "Redo")}
      </div>

      {/* Editable area */}
      <div className="relative flex-1">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          data-placeholder={placeholder}
          className="rich-text-editor outline-none px-3 py-2.5 text-sm overflow-y-auto"
          style={{
            minHeight: `${minHeight}px`,
            color: t.text,
            lineHeight: "1.6",
          }}
        />
      </div>

      <style>{`
        .rich-text-editor:empty::before {
          content: attr(data-placeholder);
          color: ${t.textMuted};
          pointer-events: none;
          position: absolute;
        }
        .rich-text-editor ul {
          list-style: disc;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .rich-text-editor ol {
          list-style: decimal;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .rich-text-editor blockquote {
          border-left: 3px solid ${t.accent};
          padding-left: 1em;
          margin: 0.5em 0;
          color: ${t.textSub};
          font-style: italic;
        }
        .rich-text-editor pre {
          background: ${t.readMain};
          border: 1px solid ${t.divider};
          border-radius: 6px;
          padding: 0.75em;
          margin: 0.5em 0;
          overflow-x: auto;
          font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
          font-size: 13px;
        }
        .rich-text-editor code {
          background: ${t.readMain};
          border-radius: 3px;
          padding: 1px 4px;
          font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
          font-size: 13px;
        }
        .rich-text-editor a {
          color: ${t.accent};
          text-decoration: underline;
        }
        .rich-text-editor p {
          margin: 0.25em 0;
        }
        .rich-text-editor img {
          max-width: 100%;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
