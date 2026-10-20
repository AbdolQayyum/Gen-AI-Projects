import Link from "next/link";
import AgentOrchestrator from "@/components/agents/agent-orchestrator";

export default function AgentsPage() {
  return (
    <main className="min-h-dvh bg-[#f8f9fb] text-slate-900">
      <div className="mx-auto min-h-dvh max-w-4xl px-5 py-8 sm:px-8">
        <header>
          <Link href="/" className="text-sm text-indigo-700 hover:underline">← Workspace</Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Agent Orchestrator</h1>
          <p className="mt-1 text-sm text-slate-500">One coordinator chooses a focused agent for each request.</p>
        </header>
        <AgentOrchestrator />
      </div>
    </main>
  );
}
