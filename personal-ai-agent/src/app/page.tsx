"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
};

type TextGenerator = (
  input: string,
  options?: {
    max_new_tokens?: number;
    temperature?: number;
    top_p?: number;
  },
) => Promise<Array<{ generated_text: string }>>;

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}

const initialAssistantMessage: Message = {
  id: createId(),
  role: "assistant",
  content:
    "Hi! I'm your free personal AI agent. I run entirely in your browser, so your conversations stay private. How can I help today?",
};

const SYSTEM_PROMPT =
  "You are MyFree Agent, a helpful and proactive personal AI assistant that runs locally in the browser. " +
  "Provide concise, actionable answers across planning, productivity, wellness, and research topics. " +
  "When useful, suggest next steps, checklists, or reminders. Avoid hallucinating facts you are not confident about. " +
  "Keep responses under 200 words unless the user requests otherwise.";

const QUICK_START = [
  "Draft a daily routine to boost my focus.",
  "Plan a 30-minute workout I can do at home.",
  "Help me brainstorm a weekend project idea.",
  "Summarize the key points of a book I'm reading.",
];

let generatorPromise: Promise<TextGenerator> | null = null;

async function loadGenerator(): Promise<TextGenerator> {
  if (!generatorPromise) {
    generatorPromise = import("@xenova/transformers").then(
      async ({ pipeline }) => {
        // LaMini-Flan models offer solid instruction tuning while remaining lightweight enough for in-browser use.
        const generator = (await pipeline(
          "text2text-generation",
          "Xenova/LaMini-Flan-T5-77M",
          {
            quantized: true,
          },
        )) as TextGenerator;

        return generator;
      },
    );
  }

  return generatorPromise;
}

function buildPrompt(history: Message[]) {
  const dialogue = history
    .map((message) => {
      const label = message.role === "assistant" ? "Assistant" : "User";
      return `${label}: ${message.content}`;
    })
    .join("\n");

  return `${SYSTEM_PROMPT}\n\n${dialogue}\nAssistant:`;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    initialAssistantMessage,
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const history = useMemo(() => messages.filter((m) => !m.pending), [messages]);

  useEffect(() => {
    if (!modelReady) {
      loadGenerator()
        .then(() => setModelReady(true))
        .catch((error) => {
          console.error("Failed to load generator", error);
          setMessages((prev) => [
            ...prev,
            {
              id: createId(),
              role: "assistant",
              content:
                "I couldn't load the on-device model. Please refresh the page or check your network connection.",
            },
          ]);
        });
    }
  }, [modelReady]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;

    const userMessage: Message = {
      id: createId(),
      role: "user",
      content: content.trim(),
    };

    const pendingMessage: Message = {
      id: createId(),
      role: "assistant",
      content: "",
      pending: true,
    };

    setMessages((prev) => [...prev, userMessage, pendingMessage]);
    setLoading(true);

    try {
      const generator = await loadGenerator();
      const prompt = buildPrompt([...history, userMessage]);
      const output = await generator(prompt, {
        max_new_tokens: 160,
        temperature: 0.7,
        top_p: 0.9,
      });

      const text =
        typeof output[0]?.generated_text === "string"
          ? output[0].generated_text.trim()
          : "I'm here and ready to assist!";

      setMessages((prev) =>
        prev.map((message) =>
          message.id === pendingMessage.id
            ? {
                ...message,
                pending: false,
                content: text.replace(/^Assistant:\s*/i, "").trim(),
              }
            : message,
        ),
      );
    } catch (error) {
      console.error(error);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === pendingMessage.id
            ? {
                ...message,
                pending: false,
                content:
                  "I ran into a hiccup while generating that. Please try again.",
              }
            : message,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentInput = input;
    setInput("");
    await sendMessage(currentInput);
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-col gap-2 px-6 pb-4 pt-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
            MyFree Agent
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            Your personal AI companion, totally free
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
            Conversations stay on your device. No logins, no subscriptions —
            just a focused assistant to help you plan, learn, and create.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 sm:flex-col sm:items-end sm:text-right">
          <span className="rounded-full border border-cyan-500/40 bg-cyan-900/30 px-3 py-1 text-cyan-200">
            Model: LaMini-Flan-T5-77M
          </span>
          <span>Runs locally in your browser</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pb-28 sm:px-6 lg:px-10">
        <section className="relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/5 bg-white/5 shadow-lg backdrop-blur">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-2xl rounded-3xl px-5 py-4 text-sm sm:text-base ${
                    message.role === "assistant"
                      ? "bg-slate-900/70 text-slate-100 ring-1 ring-white/10"
                      : "bg-cyan-500 text-slate-950"
                  }`}
                >
                  <p className="whitespace-pre-line leading-6">
                    {message.pending ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-current" />
                      </span>
                    ) : (
                      message.content
                    )}
                  </p>
                </div>
              </article>
            ))}
            <div ref={scrollAnchorRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 border-t border-white/10 bg-slate-950/70 p-4 backdrop-blur-sm sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label
                htmlFor="message"
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
              >
                Ask anything
              </label>
              <textarea
                id="message"
                name="message"
                autoFocus
                rows={2}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="E.g. Build me a tailored morning routine to stay energized."
                className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 sm:text-base"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex min-h-[46px] min-w-[120px] items-center justify-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-500/40 disabled:text-slate-400 sm:min-h-[52px] sm:text-base"
            >
              {loading ? "Thinking…" : modelReady ? "Send" : "Loading model…"}
            </button>
          </form>
        </section>

        <section className="grid gap-3 pb-4 sm:grid-cols-2">
          {QUICK_START.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={loading}
              onClick={() => {
                setInput("");
                void sendMessage(prompt);
              }}
              className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-50 disabled:cursor-not-allowed"
            >
              {prompt}
            </button>
          ))}
        </section>
      </main>
    </div>
  );
}
