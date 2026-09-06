"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { X, Send, Loader2, RotateCcw, Brain, ChevronDown } from "lucide-react";

interface Msg {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  thinkingOpen?: boolean;
  status?: string;
}

const GREETING: Msg = {
  role: "assistant",
  content: "Hi! 👋 I'm the eSIM4U assistant. Ask me about plans, coverage, installing your eSIM, your wallet or orders.",
};

/* --------------------------- tiny markdown render -------------------------- */
function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|`(.+?)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) nodes.push(<strong key={i++}>{m[1]}</strong>);
    else if (m[2] !== undefined)
      nodes.push(
        <code key={i++} className="px-1 py-0.5 rounded bg-black/[0.06] font-mono text-[12px] break-all">
          {m[2]}
        </code>
      );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;
  const flush = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };
  for (const raw of lines) {
    const t = raw.trim();
    if (t === "") {
      flush();
      continue;
    }
    const ul = /^[-*]\s+(.*)/.exec(t);
    const ol = /^\d+[.)]\s+(.*)/.exec(t);
    const h = /^#{1,6}\s+(.*)/.exec(t);
    if (ul) {
      if (!list || list.type !== "ul") {
        flush();
        list = { type: "ul", items: [] };
      }
      list.items.push(ul[1]);
      continue;
    }
    if (ol) {
      if (!list || list.type !== "ol") {
        flush();
        list = { type: "ol", items: [] };
      }
      list.items.push(ol[1]);
      continue;
    }
    flush();
    if (h) blocks.push({ type: "h", text: h[1] });
    else blocks.push({ type: "p", text: t });
  }
  flush();

  return (
    <div className="space-y-2">
      {blocks.map((b, i) => {
        if (b.type === "ul")
          return (
            <ul key={i} className="list-disc pl-4 space-y-1">
              {b.items.map((it, j) => (
                <li key={j}>{renderInline(it)}</li>
              ))}
            </ul>
          );
        if (b.type === "ol")
          return (
            <ol key={i} className="list-decimal pl-4 space-y-1">
              {b.items.map((it, j) => (
                <li key={j}>{renderInline(it)}</li>
              ))}
            </ol>
          );
        if (b.type === "h")
          return (
            <p key={i} className="font-bold">
              {renderInline(b.text)}
            </p>
          );
        return <p key={i}>{renderInline(b.text)}</p>;
      })}
    </div>
  );
}

/* --------------------------------- widget --------------------------------- */
export default function AiChatWidget() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false); // user-controlled reasoning mode
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, []);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open, scrollToBottom]);

  if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) return null;

  const patchLast = (patch: Partial<Msg>) =>
    setMessages((m) => {
      const copy = [...m];
      copy[copy.length - 1] = { ...copy[copy.length - 1], ...patch };
      return copy;
    });

  const toggleThinking = (i: number) =>
    setMessages((m) => {
      const copy = [...m];
      copy[i] = { ...copy[i], thinkingOpen: !copy[i].thinkingOpen };
      return copy;
    });

  // Runs a completion for a conversation that ends with a user message. Used by
  // both send() and retry(). Appends a fresh assistant bubble and streams into it.
  const runCompletion = async (convo: Msg[]) => {
    if (busy) return;
    setMessages([...convo, { role: "assistant", content: "", reasoning: undefined, thinkingOpen: thinking }]);
    setBusy(true);

    // Parses framed NDJSON: {"t":"r"|"c","v":"..."}. Unknown types are ignored;
    // unparseable text (plain canned messages) is treated as answer content.
    const streamReply = async (): Promise<string> => {
      patchLast({ content: "", reasoning: undefined, thinkingOpen: thinking });
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: convo, reasoning: thinking }),
      });
      if (!res.body) {
        const t = await res.text().catch(() => "");
        if (t) patchLast({ content: t });
        return t || "";
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accR = "";
      let accC = "";

      const handle = (line: string) => {
        const s = line.trim();
        if (!s) return;
        try {
          const o = JSON.parse(s);
          if (o && typeof o.t === "string" && typeof o.v === "string") {
            if (o.t === "r") {
              accR += o.v;
              patchLast({ reasoning: accR, thinkingOpen: accC ? false : true });
            } else if (o.t === "c") {
              accC += o.v;
              patchLast({ content: accC, thinkingOpen: false });
            }
            // any other type (e.g. status) is ignored
            return;
          }
          accC += s;
          patchLast({ content: accC });
        } catch {
          accC += line;
          patchLast({ content: accC });
        }
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) handle(line);
      }
      if (buffer.trim()) handle(buffer);
      return accC;
    };

    try {
      let acc = "";
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          acc = await streamReply();
        } catch {
          acc = "";
        }
        if (acc.trim()) break;
        if (attempt === 0) await new Promise((r) => setTimeout(r, 700));
      }
      if (!acc.trim()) {
        patchLast({ content: "The assistant is busy right now — please tap Retry. 🙏", reasoning: undefined });
      }
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const send = () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    runCompletion([...messages, { role: "user", content: text }]);
  };

  // Re-generate an assistant reply from the user message just before it.
  const retry = (assistantIndex: number) => {
    if (busy) return;
    const convo = messages.slice(0, assistantIndex);
    if (convo.length === 0 || convo[convo.length - 1].role !== "user") return;
    runCompletion(convo);
  };

  const clearChat = () => {
    if (busy) return;
    setMessages([GREETING]);
    setInput("");
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Bubble (bottom-right) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat assistant"
          className="fixed right-4 bottom-4 z-[9998] flex items-center gap-3 rounded-full bg-white pl-2 pr-5 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.16)] border border-gray-100 hover:shadow-[0_14px_38px_rgba(255,86,30,0.3)] hover:-translate-y-0.5 transition-all"
        >
          <span className="relative shrink-0">
            <span className="absolute inset-0 rounded-full bg-[#FF561E]/25 animate-ping" />
            <span className="relative flex w-11 h-11 rounded-full bg-gradient-to-br from-[#FF561E] to-[#FF7A45] p-[2px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/bot.png" alt="eSIM4U assistant" className="w-full h-full rounded-full object-cover bg-white" />
            </span>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
          </span>
          <span className="flex flex-col items-start leading-tight">
            <span className="text-[14px] font-bold text-[#1A1D20]">Chat with assistant</span>
            <span className="text-[11px] text-[#6B7280]">Online · Ask me anything</span>
          </span>
        </button>
      )}

      {/* Drawer / popup */}
      {open && (
        <div className="fixed right-4 bottom-4 z-[9999] w-[calc(100vw-2rem)] sm:w-[380px] h-[70vh] max-h-[560px] flex flex-col rounded-2xl bg-white shadow-[0_12px_48px_rgba(0,0,0,0.22)] border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-[#FF561E] to-[#FF7A45] text-white shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/bot.png" alt="eSIM4U assistant" className="w-9 h-9 rounded-full object-cover bg-white/20 shrink-0" />
              <div className="min-w-0">
                <p className="text-[14px] font-bold leading-tight">eSIM4U Assistant</p>
                <p className="text-[11.5px] text-white/90 leading-tight flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white/30" /> Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={clearChat}
                disabled={busy}
                aria-label="Clear chat"
                title="Clear chat"
                className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3 bg-[#FAFAFA]">
            {messages.map((m, i) => {
              const isLast = i === messages.length - 1;
              const isTyping = isLast && busy && !m.content && !m.reasoning;

              if (m.role === "user") {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[86%] px-3.5 py-2.5 rounded-2xl rounded-br-md bg-[#FF561E] text-white text-[13.5px] leading-relaxed break-words whitespace-pre-wrap">
                      {m.content}
                    </div>
                  </div>
                );
              }

              const canRetry = i > 0 && !busy;
              return (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[86%] flex flex-col items-start gap-1">
                    <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-white text-[#1A1D20] border border-gray-100 text-[13.5px] leading-relaxed break-words">
                      {m.reasoning && (
                        <div className="mb-1.5">
                          <button
                            onClick={() => toggleThinking(i)}
                            className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#6B7280] hover:text-[#FF561E] transition-colors"
                          >
                            <Brain className="w-3.5 h-3.5" />
                            {m.content ? "Thoughts" : "Thinking…"}
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${m.thinkingOpen ? "rotate-180" : ""}`} />
                          </button>
                          {m.thinkingOpen && (
                            <div className="mt-1 pl-2.5 border-l-2 border-gray-200 text-[12px] leading-relaxed text-[#6B7280] whitespace-pre-wrap">
                              {m.reasoning}
                            </div>
                          )}
                        </div>
                      )}
                      {m.content ? (
                        <Markdown text={m.content} />
                      ) : isTyping ? (
                        <span className="inline-flex items-center gap-1 text-[#9CA3AF] py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.2s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.1s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
                        </span>
                      ) : null}
                    </div>
                    {canRetry && (
                      <button
                        onClick={() => retry(i)}
                        className="inline-flex items-center gap-1 pl-1 text-[11px] text-[#9CA3AF] hover:text-[#FF561E] transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" /> Retry
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-2.5 bg-white shrink-0">
            <div className="flex items-end gap-2">
              <button
                onClick={() => setThinking((v) => !v)}
                aria-pressed={thinking}
                title={thinking ? "Thinking mode ON (slower, shows reasoning)" : "Thinking mode OFF (faster)"}
                className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border transition-colors ${
                  thinking
                    ? "bg-[#FFF4F0] border-[#FF561E] text-[#FF561E]"
                    : "bg-white border-gray-200 text-[#9CA3AF] hover:text-[#6B7280]"
                }`}
              >
                <Brain className="w-4.5 h-4.5" />
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Type your message…"
                className="flex-1 resize-none max-h-24 px-3.5 py-2.5 rounded-xl bg-[#F3F4F6] border border-transparent focus:border-[#FF561E] focus:bg-white outline-none text-[13.5px] transition-colors"
              />
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                aria-label="Send"
                className="w-10 h-10 shrink-0 rounded-xl bg-[#FF561E] text-white flex items-center justify-center hover:bg-[#E04B18] transition-colors disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Send className="w-4.5 h-4.5" />}
              </button>
            </div>
            <p className="text-[10.5px] text-[#9CA3AF] text-center mt-1.5">
              {thinking ? "Thinking mode on — shows reasoning, a bit slower." : "AI assistant — may be inaccurate."}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
