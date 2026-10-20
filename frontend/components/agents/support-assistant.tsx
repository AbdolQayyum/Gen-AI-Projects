"use client";

import { FormEvent, useState } from "react";
import { apiUrl } from "@/lib/api";

type SupportResult = {
  answer: string;
  route: "general" | "knowledge";
  sources: { filename: string; page_number: number | null; excerpt: string; distance: number }[];
};


export default function SupportAssistant() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<SupportResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setResult(null); setLoading(true);
    try {
      const response = await fetch(apiUrl("agents/support"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await response.json() as SupportResult & { detail?: string };
      if (!response.ok) throw new Error(data.detail ?? "The assistant could not answer.");
      setResult(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not reach the backend.");
    } finally { setLoading(false); }
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <form onSubmit={ask} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          What can I help you with?
          <textarea required minLength={2} maxLength={12000} rows={5} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a general question or something about company documents…" className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </label>
        <button disabled={loading || question.trim().length < 2} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{loading ? "Working…" : "Ask assistant"}</button>
      </form>
      {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {result && <section aria-live="polite" className="mt-6 border-t border-slate-100 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold">Answer</h2>
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium capitalize text-indigo-700">{result.route} route</span>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{result.answer}</p>
        {result.sources.length > 0 && <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sources</h3>
          <ul className="mt-2 space-y-2">{result.sources.map((source, index) => <li key={source.filename + ":" + index} className="rounded-xl bg-slate-50 p-3 text-sm">
            <p className="font-medium text-slate-700">{source.filename}{source.page_number ? ", page " + source.page_number : ""}</p>
            <p className="mt-1 line-clamp-4 text-slate-500">{source.excerpt}</p>
          </li>)}</ul>
        </div>}
      </section>}
      <p className="mt-6 text-xs leading-5 text-slate-400">The assistant can use a safe calculator, current UTC time, and indexed knowledge-base passages. Review important responses.</p>
    </section>
  );
}
