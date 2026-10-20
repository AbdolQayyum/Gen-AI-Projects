import Link from "next/link";
import KnowledgeBase from "@/components/knowledge/knowledge-base";

export default function KnowledgePage() {
  return (
    <main className="min-h-dvh bg-[#f8f9fb] text-slate-900">
      <div className="mx-auto min-h-dvh max-w-5xl px-5 py-8 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-sm text-indigo-700 hover:underline">← Workspace</Link>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">Knowledge Base</h1>
            <p className="mt-1 text-sm text-slate-500">Upload, index, search, and ask questions about your documents.</p>
          </div>
          <Link href="/chat" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Open chat</Link>
        </header>
        <KnowledgeBase />
      </div>
    </main>
  );
}
