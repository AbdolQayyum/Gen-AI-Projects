"use client";

import { FormEvent, useState } from "react";
import { apiUrl } from "@/lib/api";

type AgentResult = {
  answer: string;
  agent: "rag" | "support" | "document";
  sources: { filename: string; page_number: number | null; excerpt: string; distance: number }[];
};

const agentNames: Record<AgentResult["agent"], string> = {
  rag: "RAG agent",
  support: "Support agent",
  document: "Document agent",
};

export default function AgentOrchestrator() {
  const [request, setRequest] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const response = await fetch(apiUrl("agents/run"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request, document_text: documentText.trim() || null }),
      });
      const data = await response.json() as AgentResult & { detail?: string };
      if (!response.ok) throw new Error(data.detail ?? "The orchestrator could not complete the request.");
      setResult(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not reach the backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="grid gap-3 sm:grid-cols-3">
        {["RAG agent", "Support agent", "Document agent"].map((agent) => (
          <div key={agent} className="rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-700">{agent}</div>
        ))}
      </div>
      <form onSubmit={run} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          What should the agents do?
          <textarea required minLength={2} maxLength={12000} rows={3} value={request} onChange={(event) => setRequest(event.target.value)} placeholder="Ask a company policy question, get support, or request document analysis…" className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Document text <span className="font-normal text-slate-400">(optional; required for document analysis)</span>
          <textarea maxLength={30000} rows={5} value={documentText} onChange={(event) => setDocumentText(event.target.value)} placeholder="Paste text for the document agent to summarize or analyze…" className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </label>
        <button disabled={loading || request.trim().length < 2} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{loading ? "Choosing an agent…" : "Run orchestrator"}</button>
      </form>
      {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {result && <section aria-live="polite" className="mt-6 border-t border-slate-100 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold">Answer</h2>
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700">Handled by {agentNames[result.agent]}</span>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{result.answer}</p>
        {result.sources.length > 0 && <ul className="mt-5 space-y-2">{result.sources.map((source, index) => <li key={source.filename + ":" + index} className="rounded-xl bg-slate-50 p-3 text-sm">
          <p className="font-medium text-slate-700">{source.filename}{source.page_number ? ", page " + source.page_number : ""}</p>
          <p className="mt-1 line-clamp-4 text-slate-500">{source.excerpt}</p>
        </li>)}</ul>}
      </section>}
      <p className="mt-6 text-xs leading-5 text-slate-400">This is a small routed workflow, not an autonomous multi-agent system. The coordinator selects one agent, which handles the request and returns its result.</p>
    </section>
  );
}
