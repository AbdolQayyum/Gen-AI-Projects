import Link from "next/link";
import SupportAssistant from "@/components/agents/support-assistant";

export default function AssistantPage() {
  return (
    <main className="min-h-dvh bg-[#f8f9fb] text-slate-900">
      <div className="mx-auto min-h-dvh max-w-4xl px-5 py-8 sm:px-8">
        <header>
          <Link href="/" className="text-sm text-indigo-700 hover:underline">← Workspace</Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Support Assistant</h1>
          <p className="mt-1 text-sm text-slate-500">Questions are routed through a LangGraph workflow with tools and indexed document search.</p>
        </header>
        <SupportAssistant />
      </div>
    </main>
  );
}
