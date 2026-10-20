"use client";

import { FormEvent, useState } from "react";
import { apiUrl } from "@/lib/api";

type Tool = "summarize" | "email" | "resume-review" | "meeting-notes";

const toolOptions: { id: Tool; label: string; description: string }[] = [
  { id: "summarize", label: "Summarizer", description: "Create a short overview and key points." },
  { id: "email", label: "Email writer", description: "Draft an email from its purpose and context." },
  { id: "resume-review", label: "Resume review", description: "Get strengths and concrete suggestions." },
  { id: "meeting-notes", label: "Meeting notes", description: "Organize decisions, actions, and open questions." },
];


export default function AITools() {
  const [activeTool, setActiveTool] = useState<Tool>("summarize");
  const [text, setText] = useState("");
  const [purpose, setPurpose] = useState("");
  const [recipientContext, setRecipientContext] = useState("");
  const [tone, setTone] = useState("professional");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedTool = toolOptions.find((tool) => tool.id === activeTool)!;

  async function runTool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult("");
    setLoading(true);
    let body: Record<string, string>;
    if (activeTool === "email") body = { purpose, recipient_context: recipientContext, tone };
    else if (activeTool === "resume-review") body = { resume_text: text };
    else if (activeTool === "meeting-notes") body = { notes: text };
    else body = { text };

    try {
      const response = await fetch(apiUrl("tools/" + activeTool), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: { result?: string; detail?: string } = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "The tool request failed.");
      setResult(data.result ?? "");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not reach the backend.");
    } finally {
      setLoading(false);
    }
  }

  const textTooShort = text.trim().length < (activeTool === "resume-review" ? 30 : 20);
  const emailIncomplete = !purpose.trim() || !recipientContext.trim();

  return (
    <section className="mt-8 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav aria-label="AI tools" className="h-fit rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {toolOptions.map((tool) => (
          <button key={tool.id} type="button" onClick={() => { setActiveTool(tool.id); setResult(""); setError(""); }}
            aria-pressed={activeTool === tool.id}
            className={"mb-1 w-full rounded-xl px-3 py-3 text-left text-sm font-medium transition last:mb-0 " + (activeTool === tool.id ? "bg-indigo-50 text-indigo-800" : "text-slate-600 hover:bg-slate-50")}>
            {tool.label}
          </button>
        ))}
      </nav>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-semibold">{selectedTool.label}</h2>
        <p className="mt-1 text-sm text-slate-500">{selectedTool.description}</p>
        <form onSubmit={runTool} className="mt-6 space-y-4">
          {activeTool === "email" ? (
            <>
              <label className="block text-sm font-medium text-slate-700">
                Email purpose
                <input required minLength={3} maxLength={1000} value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="What should this email accomplish?" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Recipient and context
                <textarea required minLength={3} maxLength={2000} rows={3} value={recipientContext} onChange={(event) => setRecipientContext(event.target.value)} placeholder="Who is it for, and what should the assistant know?" className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Tone
                <select value={tone} onChange={(event) => setTone(event.target.value)} className="mt-1.5 block rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal">
                  <option value="professional">Professional</option><option value="friendly">Friendly</option><option value="formal">Formal</option><option value="concise">Concise</option>
                </select>
              </label>
            </>
          ) : (
            <label className="block text-sm font-medium text-slate-700">
              {activeTool === "resume-review" ? "Resume text" : activeTool === "meeting-notes" ? "Meeting notes" : "Text to summarize"}
              <textarea required minLength={activeTool === "resume-review" ? 30 : 20} maxLength={30000} rows={11} value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste your text here…" className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
              <span className="mt-1 block text-right text-xs font-normal text-slate-400">{text.length.toLocaleString()} / 30,000 characters</span>
            </label>
          )}
          <button disabled={loading || (activeTool === "email" ? emailIncomplete : textTooShort)} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Working…" : "Generate"}
          </button>
        </form>
        {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        {result && <section aria-live="polite" className="mt-6 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-semibold">Result</h3>
          <div className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{result}</div>
        </section>}
      </div>
    </section>
  );
}
