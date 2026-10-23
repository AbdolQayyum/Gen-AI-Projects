"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

type Evaluation = {
  id: number;
  question: string;
  retrieved_context: { filename: string; page_number: number | null; excerpt: string; distance: number }[];
  generated_answer: string;
  expected_answer: string;
  scores: { answer_relevance: number; context_relevance: number; faithfulness: number; hallucination_risk: number; reasoning: string };
  tracing_project: string | null;
  created_at: string;
};

type AnswerToEvaluate = { question: string; answer: string };

const metrics: { key: keyof Evaluation["scores"]; label: string }[] = [
  { key: "answer_relevance", label: "Answer relevance" },
  { key: "context_relevance", label: "Context relevance" },
  { key: "faithfulness", label: "Faithfulness" },
  { key: "hallucination_risk", label: "Hallucination risk" },
];

export default function Evaluations({
  sourceAnswer,
}: {
  sourceAnswer: AnswerToEvaluate | null;
}) {
  const [question, setQuestion] = useState("");
  const [answerToEvaluate, setAnswerToEvaluate] = useState("");
  const [expectedAnswer, setExpectedAnswer] = useState("");
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sourceAnswer) return;
    setQuestion(sourceAnswer.question);
    setAnswerToEvaluate(sourceAnswer.answer);
  }, [sourceAnswer]);

  async function loadEvaluations() {
    const response = await fetch(apiUrl("evaluations?limit=20"));
    const data = await response.json() as { evaluations?: Evaluation[]; detail?: string };
    if (!response.ok) throw new Error(data.detail ?? "Could not load evaluation history.");
    setEvaluations(data.evaluations ?? []);
  }

  useEffect(() => {
    let active = true;
    fetch(apiUrl("evaluations?limit=20")).then(async (response) => {
      const data = await response.json() as { evaluations?: Evaluation[]; detail?: string };
      if (!response.ok) throw new Error(data.detail ?? "Could not load evaluation history.");
      if (active) setEvaluations(data.evaluations ?? []);
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : "Could not reach the backend.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function evaluate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setRunning(true);
    try {
      const response = await fetch(apiUrl("evaluations/run"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          expected_answer: expectedAnswer,
          ...(answerToEvaluate.trim() ? { generated_answer: answerToEvaluate } : {}),
        }),
      });
      const data = await response.json() as Evaluation & { detail?: string };
      if (!response.ok) throw new Error(data.detail ?? "Evaluation failed.");
      setEvaluations((current) => [data, ...current.filter((item) => item.id !== data.id)].slice(0, 20));
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Could not complete the evaluation.");
    } finally { setRunning(false); }
  }

  return (
    <section className="mt-8 space-y-6">
      <form onSubmit={evaluate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="font-semibold">Evaluate a RAG answer</h2>
        <p className="mt-1 text-sm leading-5 text-slate-500">Evaluate the answer from your latest document question, or leave the answer field empty to generate a fresh answer. The backend retrieves context and scores the answer against your reference.</p>
        <label className="mt-5 block text-sm font-medium text-slate-700">
          Question
          <textarea required minLength={2} maxLength={2000} rows={3} value={question} onChange={(event) => setQuestion(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500" placeholder="What does the indexed policy say about annual leave?" />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Answer to evaluate <span className="font-normal text-slate-400">(optional; defaults to the latest RAG answer)</span>
          <textarea maxLength={12000} rows={4} value={answerToEvaluate} onChange={(event) => setAnswerToEvaluate(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500" placeholder="Leave blank to generate a fresh answer from the retrieved context." />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Expected answer
          <textarea required minLength={2} maxLength={8000} rows={3} value={expectedAnswer} onChange={(event) => setExpectedAnswer(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-indigo-500" placeholder="The answer you consider correct, based on your source documents." />
        </label>
        <button disabled={running || question.trim().length < 2 || expectedAnswer.trim().length < 2} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{running ? "Retrieving and scoring…" : answerToEvaluate.trim() ? "Evaluate this answer" : "Generate and evaluate answer"}</button>
      </form>
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Recent evaluation runs</h2>
          <button type="button" onClick={() => { setLoading(true); loadEvaluations().catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not refresh evaluations.")).finally(() => setLoading(false)); }} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Refresh</button>
        </div>
        {loading ? <p className="mt-4 text-sm text-slate-500">Loading evaluation history…</p> : evaluations.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-7 text-center text-sm text-slate-500">No evaluation runs yet. Add a reference question above to create one.</div>
        ) : <ul className="mt-4 space-y-4">{evaluations.map((evaluation) => (
          <li key={evaluation.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h3 className="text-sm font-semibold">{evaluation.question}</h3><p className="mt-1 text-xs text-slate-400">{new Date(evaluation.created_at).toLocaleString()}{evaluation.tracing_project ? " · LangSmith: " + evaluation.tracing_project : ""}</p></div>
              <div className="flex flex-wrap gap-2">{metrics.map((metric) => <span key={metric.key} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{metric.label}: {evaluation.scores[metric.key]}/5</span>)}</div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div><h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Answer evaluated</h4><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{evaluation.generated_answer}</p></div>
              <div><h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expected answer</h4><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{evaluation.expected_answer}</p></div>
            </div>
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm leading-5 text-amber-950"><span className="font-semibold">Judge notes: </span>{evaluation.scores.reasoning}</p>
            <details className="mt-4 text-sm"><summary className="cursor-pointer font-medium text-indigo-700">Retrieved context ({evaluation.retrieved_context.length})</summary>
              {evaluation.retrieved_context.length ? <ul className="mt-3 space-y-2">{evaluation.retrieved_context.map((source, index) => <li key={source.filename + index} className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-600">{source.filename}{source.page_number ? ", p. " + source.page_number : ""}</p><p className="mt-1 line-clamp-4 text-xs leading-5 text-slate-500">{source.excerpt}</p></li>)}</ul> : <p className="mt-2 text-slate-500">No passages were retrieved.</p>}
            </details>
          </li>
        ))}</ul>}
      </div>
      <p className="text-xs leading-5 text-slate-400">Scores are LLM-judge estimates from 1–5, not ground truth. Verify important results manually. Each run makes separate calls to the configured generation provider for answering and judging.</p>
    </section>
  );
}
