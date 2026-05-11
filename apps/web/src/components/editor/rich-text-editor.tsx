import { useRef, type ChangeEvent } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function uploadImage(file: File): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("You must be signed in to upload images");

  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_URL}/api/v1/admin/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? "Upload failed");
  }
  const json = (await res.json()) as { url: string };
  return json.url;
}

type ToolbarButtonProps = {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
};

function ToolbarButton({ icon, label, active, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-lg text-sm transition-colors",
        active
          ? "bg-brand-900 text-white"
          : "text-brand-600 hover:bg-brand-50 hover:text-brand-900",
      )}
    >
      <i className={icon} aria-hidden="true" />
    </button>
  );
}

function Toolbar({
  editor,
  onPickImage,
}: {
  editor: Editor;
  onPickImage: () => void;
}) {
  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-brand-100 bg-brand-50/40 px-2 py-1.5">
      <ToolbarButton
        icon="fa-solid fa-bold"
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon="fa-solid fa-italic"
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon="fa-solid fa-strikethrough"
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />

      <span aria-hidden className="mx-1 h-5 w-px bg-brand-200" />

      <ToolbarButton
        icon="fa-solid fa-heading"
        label="Heading"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      />
      <ToolbarButton
        icon="fa-solid fa-list-ul"
        label="Bulleted list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon="fa-solid fa-list-ol"
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        icon="fa-solid fa-quote-right"
        label="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />

      <span aria-hidden className="mx-1 h-5 w-px bg-brand-200" />

      <ToolbarButton
        icon="fa-solid fa-link"
        label="Link"
        active={editor.isActive("link")}
        onClick={setLink}
      />
      <ToolbarButton
        icon="fa-solid fa-image"
        label="Insert image"
        onClick={onPickImage}
      />

      <span aria-hidden className="mx-1 h-5 w-px bg-brand-200" />

      <ToolbarButton
        icon="fa-solid fa-rotate-left"
        label="Undo"
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        icon="fa-solid fa-rotate-right"
        label="Redo"
        onClick={() => editor.chain().focus().redo().run()}
      />
    </div>
  );
}

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something…",
  className,
  minHeight = "min-h-[160px]",
}: Props) {
  const fileInput = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: cn(
          "rich-content focus:outline-none px-4 py-3",
          minHeight,
        ),
      },
    },
  });

  if (!editor) {
    return (
      <div
        className={cn(
          "rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm text-brand-400",
          minHeight,
        )}
      >
        Loading editor…
      </div>
    );
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    try {
      const url = await uploadImage(file);
      editor!.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-brand-100 bg-white shadow-sm focus-within:border-highlight-400 focus-within:ring-2 focus-within:ring-highlight-200",
        className,
      )}
    >
      <Toolbar editor={editor} onPickImage={() => fileInput.current?.click()} />
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFile}
      />
      <EditorContent editor={editor} />
    </div>
  );
}
