import Link from "next/link";
import Evaluations from "@/components/evaluations/evaluations";

export default function EvaluationsPage() {
  return (
    <main className="min-h-dvh bg-[#f8f9fb] text-slate-900">
      <div className="mx-auto min-h-dvh max-w-5xl px-5 py-8 sm:px-8">
        <header>
          <Link href="/" className="text-sm text-indigo-700 hover:underline">← Workspace</Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">RAG Evaluations</h1>
          <p className="mt-1 text-sm text-slate-500">Compare retrieved evidence and generated answers with a reference answer.</p>
        </header>
        <Evaluations />
      </div>
    </main>
  );
}
