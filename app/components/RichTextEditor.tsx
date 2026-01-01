'use client';

import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Write your comment...',
  maxLength = 1000,
  className,
  disabled = false,
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editable: !disabled,
    immediatelyRender: false, // Fix SSR hydration mismatch
  });

  // Don't render until mounted (client-side only)
  if (!mounted || !editor) {
    return (
      <div className={cn('border rounded-lg', className)}>
        <div className="p-3 min-h-[100px] flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading editor...</div>
        </div>
      </div>
    );
  }

  const currentLength = editor.storage.characterCount.characters() || 0;
  const isNearLimit = currentLength >= maxLength * 0.9;
  const isOverLimit = currentLength > maxLength;

  const toggleBold = () => editor.chain().focus().toggleBold().run();
  const toggleItalic = () => editor.chain().focus().toggleItalic().run();
  const toggleBulletList = () => editor.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor.chain().focus().toggleOrderedList().run();
  const setLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className={cn('border rounded-lg', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleBold}
          disabled={disabled}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('bold') && 'bg-primary/10'
          )}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleItalic}
          disabled={disabled}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('italic') && 'bg-primary/10'
          )}
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleBulletList}
          disabled={disabled}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('bulletList') && 'bg-primary/10'
          )}
          aria-label="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleOrderedList}
          disabled={disabled}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('orderedList') && 'bg-primary/10'
          )}
          aria-label="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={setLink}
          disabled={disabled}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('link') && 'bg-primary/10'
          )}
          aria-label="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <div className="ml-auto text-xs text-muted-foreground">
          <span className={cn(
            isOverLimit && 'text-destructive',
            isNearLimit && !isOverLimit && 'text-yellow-600'
          )}>
            {currentLength}/{maxLength}
          </span>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className={cn(
          'prose prose-sm max-w-none p-3 min-h-[100px] focus:outline-none',
          '[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[100px]',
          '[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ml-4',
          '[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ml-4',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
          isOverLimit && 'border-destructive'
        )}
      />
    </div>
  );
}

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: use a simple regex-based sanitizer or return as-is
    // For production, consider using a server-side sanitization library
    return html;
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

/**
 * Convert HTML to plain text (for character counting)
 */
export function htmlToText(html: string): string {
  if (typeof window === 'undefined') {
    return html.replace(/<[^>]*>/g, '').trim();
  }
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

