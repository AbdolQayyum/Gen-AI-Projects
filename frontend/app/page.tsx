import Link from "next/link";

const capabilities = [
  { icon: "✳", title: "AI Chat", description: "Ask questions and continue a conversation with your AI assistant.", status: "Ready", href: "/chat" },
  { icon: "▤", title: "Knowledge Base", description: "Index documents, search by meaning, and ask questions with source references.", status: "Ready", href: "/knowledge" },
  { icon: "✧", title: "AI Tools", description: "Summarize text, draft emails, review resumes, and organize meeting notes.", status: "Ready", href: "/tools" },
  { icon: "◎", title: "AI Assistant", description: "Route support questions through a tool-enabled workflow with document sources.", status: "Ready", href: "/assistant" },
  { icon: "⎇", title: "Agent Orchestrator", description: "Route requests to RAG, support, or document analysis agents.", status: "Ready", href: "/agents" },
  { icon: "▥", title: "Evaluations", description: "Score RAG answer relevance, context relevance, faithfulness, and hallucination risk.", status: "Ready", href: "/evaluations" },
];

export default function DashboardPage() {
  return (
    <main className="min-h-dvh bg-[#f8f9fb] text-slate-900">
      <div className="mx-auto flex min-h-dvh max-w-[1440px]">
        <aside className="hidden w-[260px] shrink-0 flex-col border-r border-slate-200/80 bg-[#f2f4f7] p-4 md:flex">
          <Link href="/" className="flex items-center gap-3 px-2 py-2">
            <div className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-sm font-bold text-white">K</div>
            <div>
              <p className="text-sm font-semibold leading-5">Knowledge Assistant</p>
              <p className="text-xs text-slate-500">AI workspace</p>
            </div>
          </Link>
          <nav aria-label="Main navigation" className="mt-8 space-y-1">
            <Link href="/" aria-current="page" className="flex items-center gap-3 rounded-xl bg-indigo-100/70 px-3 py-2.5 text-sm font-medium text-indigo-800">
              <span aria-hidden="true">⌂</span> Dashboard
            </Link>
            <Link href="/chat" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-white">
              <span aria-hidden="true">✳</span> AI Chat
            </Link>
            <Link href="/knowledge" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-white"><span aria-hidden="true">▤</span> Knowledge Base</Link>
            <Link href="/tools" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-white"><span aria-hidden="true">✧</span> AI Tools</Link>
            <Link href="/assistant" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-white"><span aria-hidden="true">◎</span> Support Assistant</Link>
            <Link href="/agents" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-white"><span aria-hidden="true">⎇</span> Agent Orchestrator</Link>
            <Link href="/evaluations" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-white"><span aria-hidden="true">▥</span> Evaluations</Link>
          </nav>
          <div className="mt-auto rounded-xl border border-slate-200/80 bg-white/80 p-3">
            <p className="text-xs font-semibold text-slate-700">Your AI workspace</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">More capabilities will appear here as the project grows.</p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 p-5 sm:p-8 lg:p-12">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-sm font-bold text-white md:hidden">K</div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-indigo-600">Workspace</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight">Dashboard</h1>
              </div>
            </div>
            <Link href="/chat" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700">
              Open AI Chat <span aria-hidden="true">→</span>
            </Link>
          </header>

          <div className="mt-10 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white p-6 sm:p-9">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-indigo-700">AI Knowledge &amp; Support Assistant</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">A clearer way to work with AI.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Chat with Gemini, use practical AI writing tools, and search or ask questions across your indexed documents.</p>
              <Link href="/chat" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700">
                Start a conversation <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          <div className="mb-4 mt-10 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Workspace capabilities</h2>
              <p className="mt-1 text-sm text-slate-500">Your project, one useful feature at a time.</p>
            </div>
            <span className="rounded-full bg-slate-200/70 px-3 py-1 text-xs font-medium text-slate-600">Phase 12 of 12</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {capabilities.map((capability) => {
              const card = (
                <article className={`h-full rounded-2xl border bg-white p-5 shadow-sm shadow-slate-200/40 ${capability.href ? "border-indigo-200 transition hover:-translate-y-0.5 hover:shadow-md" : "border-slate-200"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className={`grid size-10 place-items-center rounded-xl text-lg ${capability.href ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"}`}>{capability.icon}</div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${capability.href ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{capability.status}</span>
                  </div>
                  <h3 className="mt-5 text-sm font-semibold">{capability.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{capability.description}</p>
                </article>
              );
              return capability.href ? <Link key={capability.title} href={capability.href}>{card}</Link> : <div key={capability.title}>{card}</div>;
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
