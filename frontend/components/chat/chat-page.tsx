"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string };
type StreamEvent = { type: "token" | "done" | "error"; content: string };
const MAX_CHAT_MESSAGES = 40;

const suggestions = [
  "Help me write a clear project update",
  "Explain how semantic search works",
  "Summarize the key ideas in a long document",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [historyNotice, setHistoryNotice] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function sendMessage(text = input) {
    const content = text.trim();
    if (!content || isStreaming) return;

    let recentMessages = messages;
    let removedOldTurns = false;
    while (recentMessages.length + 1 > MAX_CHAT_MESSAGES) {
      const assistantIndex = recentMessages.findIndex((message, index) => index > 0 && message.role === "assistant");
      recentMessages = recentMessages.slice(assistantIndex === 1 ? 2 : 1);
      removedOldTurns = true;
    }
    const nextMessages: Message[] = [...recentMessages, { role: "user", content }];
    if (removedOldTurns) {
      setHistoryNotice("Older turns were removed from this chat to stay within the 40-message limit.");
    }
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setError("");
    setIsStreaming(true);

    try {
      const response = await fetch(apiUrl("chat/stream"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const detail = body?.error?.message ?? body?.detail;
        throw new Error(typeof detail === "string" ? detail : `The request failed (${response.status}).`);
      }
      if (!response.body) throw new Error("The browser could not read the response stream.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = "";
      let streamError = "";
      const handleLine = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line) as StreamEvent;
        if (event.type === "token") {
          setMessages((current) => {
            const updated = [...current];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              updated[updated.length - 1] = { ...last, content: last.content + event.content };
            }
            return updated;
          });
        } else if (event.type === "error") {
          streamError = event.content;
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        pending += decoder.decode(value, { stream: !done });
        const lines = pending.split("\n");
        pending = lines.pop() ?? "";
        for (const line of lines) handleLine(line);
        if (done) break;
      }
      if (pending.trim()) handleLine(pending);
      if (streamError) throw new Error(streamError);
    } catch (sendError) {
      setMessages((current) => current[current.length - 1]?.content ? current : current.slice(0, -1));
      setError(
        sendError instanceof TypeError
          ? "Could not reach the backend. Start FastAPI and try again."
          : sendError instanceof Error
            ? sendError.message
            : "Something went wrong while sending your message."
      );
    } finally {
      setIsStreaming(false);
      textareaRef.current?.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function startNewChat() {
    if (isStreaming) return;
    setMessages([]);
    setInput("");
    setError("");
    setHistoryNotice("");
    textareaRef.current?.focus();
  }

  return (
    <main className="flex h-dvh min-h-[540px] bg-[#f8f9fb] text-slate-900">
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-slate-200/80 bg-[#f2f4f7] p-4 md:flex">
        <Link href="/" className="flex items-center gap-3 px-2 py-2">
          <div className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-sm font-bold text-white">K</div>
          <div>
            <p className="text-sm font-semibold leading-5">Knowledge Assistant</p>
            <p className="text-xs text-slate-500">AI workspace</p>
          </div>
        </Link>
        <button
          className="mt-8 flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          onClick={startNewChat}
          disabled={isStreaming}
        >
          <span className="text-lg leading-none">＋</span> New chat
        </button>
        <div className="mt-8">
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-white">
            <span aria-hidden="true">⌂</span> Dashboard
          </Link>
          <Link href="/chat" aria-current="page" className="mt-1 flex items-center gap-3 rounded-xl bg-indigo-100/70 px-3 py-2.5 text-sm font-medium text-indigo-800">
            <span aria-hidden="true">✳</span> AI Chat <span className="ml-auto text-xs">Now</span>
          </Link>
          <Link href="/knowledge" className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-white">
            <span aria-hidden="true">▤</span> Knowledge Base
          </Link>
          <Link href="/tools" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-white">
            <span aria-hidden="true">✧</span> AI Tools
          </Link>
        </div>
        <div className="mt-auto rounded-xl border border-slate-200/80 bg-white/80 p-3">
          <p className="text-xs font-semibold text-slate-700">AI Chat</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Messages stay in this browser session. Saved conversations arrive with database setup.</p>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/70 px-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-xs font-bold text-white md:hidden">K</div>
            <div>
              <h1 className="text-sm font-semibold">AI Chat</h1>
              <p className="text-xs text-slate-500">A helpful assistant for your work</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
            Model configured on backend
          </div>
          <button
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 md:hidden"
            onClick={startNewChat}
            disabled={isStreaming}
          >
            New chat
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {messages.length === 0 ? (
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 pb-10 pt-12 sm:px-8">
              <div className="mb-7 grid size-12 place-items-center rounded-2xl bg-indigo-100 text-2xl text-indigo-700">✳</div>
              <p className="text-sm font-medium text-indigo-700">Your AI workspace</p>
              <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">What can I help you with?</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">Ask a question, explore an idea, or get a first draft. You can keep adding messages to continue the conversation.</p>
              <div className="mt-9 grid gap-3 sm:grid-cols-3">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => void sendMessage(suggestion)}
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm leading-5 text-slate-600 shadow-sm shadow-slate-200/40 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-slate-900 disabled:opacity-50"
                    disabled={isStreaming}
                  >
                    {suggestion}<span className="mt-3 block text-indigo-500">↗</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-8 pt-8 sm:px-8">
              <div className="space-y-7">
                {historyNotice && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{historyNotice}</p>}
                {messages.map((message, index) => (
                  <article key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    {message.role === "assistant" && <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-indigo-100 text-sm text-indigo-700">✳</div>}
                    <div className={message.role === "user" ? "max-w-[85%] rounded-2xl rounded-br-md bg-indigo-600 px-4 py-3 text-sm leading-6 text-white" : "max-w-[90%] pt-1 text-sm leading-7 text-slate-800"}>
                      {message.content ? <p className="whitespace-pre-wrap">{message.content}</p> : isStreaming && index === messages.length - 1 ? <span className="inline-flex items-center gap-2 text-slate-400"><span className="flex gap-1"><i className="size-1.5 animate-bounce rounded-full bg-indigo-400" /><i className="size-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:120ms]" /><i className="size-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:240ms]" /></span>Thinking</span> : null}
                      {message.role === "assistant" && message.content && isStreaming && index === messages.length - 1 && <span className="ml-1 inline-block h-4 w-px animate-pulse bg-indigo-500 align-middle" />}
                    </div>
                  </article>
                ))}
                {error && <div role="alert" className="ml-11 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800">{error}</div>}
              </div>
              <div ref={bottomRef} />
            </div>
          )}

          {messages.length === 0 && error && <div role="alert" className="mx-auto mb-4 w-full max-w-3xl px-5 text-sm text-rose-700 sm:px-8">{error}</div>}

          <div className="sticky bottom-0 w-full bg-gradient-to-t from-[#f8f9fb] via-[#f8f9fb] to-transparent px-4 pb-5 pt-3 sm:px-8 sm:pb-7">
            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
              <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_8px_30px_-18px_rgba(15,23,42,0.25)] focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100/60">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message your AI assistant..."
                  aria-label="Message your AI assistant"
                  rows={2}
                  maxLength={12_000}
                  disabled={isStreaming}
                  className="block max-h-40 min-h-14 w-full resize-y bg-transparent px-3 py-2 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60"
                />
                <div className="flex items-center justify-between px-2 pb-1">
                  <p className="text-[11px] text-slate-400">Enter to send · Shift + Enter for a new line</p>
                  <button
                    type="submit"
                    aria-label={isStreaming ? "Waiting for response" : "Send message"}
                    disabled={!input.trim() || isStreaming}
                    className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-lg text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    {isStreaming ? <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : "↑"}
                  </button>
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-400">AI responses can be inaccurate. Check important information.</p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
