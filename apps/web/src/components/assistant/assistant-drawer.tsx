import { useEffect, useRef, useState } from "react";
import { RotateCcw, Send, Sparkles, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAssistant } from "./assistant-context";
import { Markdown } from "./markdown";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How do I request time off?",
  "Who runs the Engineering department?",
  "How much PTO do I have left?",
  "How do I give feedback?",
];

export function AssistantDrawer() {
  const { isOpen, close } = useAssistant();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || isSending) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setDraft("");
    setIsSending(true);
    try {
      const res = await api<{ reply: string }>("/api/v1/assistant/chat", {
        method: "POST",
        body: JSON.stringify({ messages: next.slice(-12) }),
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply },
      ]);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Something went wrong.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry — ${msg}` },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-brand-900/20 backdrop-blur-sm"
        onClick={close}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-brand-100 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-brand-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-highlight-100 text-highlight-700">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-brand-900">Ask Tad</p>
              <p className="text-xs text-brand-500">
                Your company knowledge assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setMessages([]);
                setDraft("");
              }}
              disabled={messages.length === 0 || isSending}
              title="Reset chat"
              className="grid h-8 w-8 place-items-center rounded-lg text-brand-500 hover:bg-brand-50 hover:text-brand-900 disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={close}
              title="Close"
              className="grid h-8 w-8 place-items-center rounded-lg text-brand-500 hover:bg-brand-50 hover:text-brand-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-brand-600">
                Hi! I can help with how-to questions and finding people. Try one
                of these:
              </p>
              <div className="flex flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="rounded-xl border border-brand-100 px-3 py-2 text-left text-sm text-brand-700 transition-colors hover:bg-brand-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "whitespace-pre-wrap rounded-br-sm bg-brand-900 text-white"
                      : "rounded-bl-sm border border-brand-100 bg-white text-brand-800",
                  )}
                >
                  {m.role === "assistant" ? (
                    <Markdown text={m.content} />
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))
          )}
          {isSending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-brand-100 bg-white px-4 py-3">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400" />
                </span>
                <span className="text-xs text-brand-500">Tad is thinking…</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-brand-100 px-5 py-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(draft);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask a question…"
              autoFocus
              className="h-10 flex-1 rounded-lg border border-brand-100 bg-white px-3 text-sm text-brand-900 placeholder:text-brand-400 focus:border-highlight-400 focus:outline-none focus:ring-2 focus:ring-highlight-200"
            />
            <button
              type="submit"
              disabled={!draft.trim() || isSending}
              className="grid h-10 w-10 place-items-center rounded-lg bg-brand-900 text-white transition-colors hover:bg-brand-800 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-2 text-[10px] text-brand-400">
            Tad can only see what you have access to. Double-check important
            details.
          </p>
        </div>
      </aside>
    </div>
  );
}
