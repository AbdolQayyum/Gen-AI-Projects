import Link from "next/link";
import AITools from "@/components/tools/ai-tools";

export default function ToolsPage() {
  return (
    <main className="min-h-dvh bg-[#f8f9fb] text-slate-900">
      <div className="mx-auto min-h-dvh max-w-5xl px-5 py-8 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-sm text-indigo-700 hover:underline">← Workspace</Link>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">AI Tools</h1>
            <p className="mt-1 text-sm text-slate-500">Small, focused tools for everyday writing and document work.</p>
          </div>
          <Link href="/chat" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Open chat</Link>
        </header>
        <AITools />
        <p className="mt-6 text-xs leading-5 text-slate-500">AI output can be inaccurate. Review generated content before using or sharing it.</p>
      </div>
    </main>
  );
}
