"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  ImagePlus,
  Undo,
  Redo,
  Code,
} from "lucide-react";
import { toast } from "sonner";

interface RichTextEditorProps {
  content: string;
  onUpdate: (html: string) => void;
  placeholder?: string;
  courseId?: string | number;
  sessionId?: number;
}

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded transition ${
        active
          ? "bg-foreground text-background"
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

async function uploadImage(file: File, courseId: string | number, sessionId: number): Promise<string | null> {
  try {
    // Get presigned URL
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        courseId,
        sessionId,
      }),
    });

    if (!res.ok) return null;
    const { uploadUrl, key } = await res.json();

    // Upload to R2
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadRes.ok) return null;

    // Return proxy URL
    return `/api/files/${key}`;
  } catch {
    return null;
  }
}

export function RichTextEditor({ content, onUpdate, placeholder, courseId, sessionId }: RichTextEditorProps) {
  const canUpload = courseId !== undefined && sessionId !== undefined;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      TiptapImage.configure({
        HTMLAttributes: { class: "rounded-lg max-w-full" },
        allowBase64: !canUpload, // Allow base64 only if no upload configured
      }),
      Placeholder.configure({
        placeholder: placeholder || "Bắt đầu viết nội dung...",
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] px-4 py-3 outline-none prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-a:text-primary prose-a:underline prose-img:rounded-lg prose-img:border-2 prose-img:border-foreground prose-img:shadow-brutal-sm",
      },
      handlePaste: canUpload ? (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) return false;

            toast.promise(
              uploadImage(file, courseId, sessionId).then((url) => {
                if (url && editor) {
                  editor.chain().focus().setImage({ src: url, alt: file.name }).run();
                } else {
                  throw new Error("Upload failed");
                }
              }),
              {
                loading: "Đang upload hình ảnh...",
                success: "Đã thêm hình ảnh",
                error: "Không thể upload hình ảnh",
              }
            );
            return true;
          }
        }
        return false;
      } : undefined,
      handleDrop: canUpload ? (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;

        const file = files[0];
        if (!file.type.startsWith("image/")) return false;

        event.preventDefault();
        toast.promise(
          uploadImage(file, courseId, sessionId).then((url) => {
            if (url && editor) {
              editor.chain().focus().setImage({ src: url, alt: file.name }).run();
            } else {
              throw new Error("Upload failed");
            }
          }),
          {
            loading: "Đang upload hình ảnh...",
            success: "Đã thêm hình ảnh",
            error: "Không thể upload hình ảnh",
          }
        );
        return true;
      } : undefined,
    },
    onBlur: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  if (!editor) return null;

  function setLink() {
    const url = window.prompt("URL:");
    if (!url || !editor) return;
    editor.chain().focus().setLink({ href: url }).run();
  }

  function addImage() {
    if (!canUpload) {
      const url = window.prompt("URL hình ảnh:");
      if (url) editor.chain().focus().setImage({ src: url }).run();
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      toast.promise(
        uploadImage(file, courseId!, sessionId!).then((url) => {
          if (url) {
            editor.chain().focus().setImage({ src: url, alt: file.name }).run();
          } else {
            throw new Error("Upload failed");
          }
        }),
        {
          loading: "Đang upload hình ảnh...",
          success: "Đã thêm hình ảnh",
          error: "Không thể upload hình ảnh",
        }
      );
    };
    input.click();
  }

  return (
    <div className="border-2 border-foreground rounded-lg overflow-hidden shadow-brutal-sm bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b-2 border-foreground bg-muted/30 flex-wrap">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
          <Code className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Link">
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addImage} title="Thêm hình ảnh">
          <ImagePlus className="w-4 h-4" />
        </ToolbarButton>
        <div className="flex-1" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
