"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

type DocumentRecord = { id: number; filename: string; content_type: string; size_bytes: number; uploaded_at: string; indexed: boolean; chunk_count: number };
type SearchResult = { document_id: number; filename: string; page_number: number | null; content: string; distance: number };
type RagAnswer = { answer: string; sources: { filename: string; page_number: number | null; excerpt: string; distance: number }[] };
type RAGAnswerForEvaluation = { question: string; answer: string };

async function requestDocuments(): Promise<DocumentRecord[]> {
  const response = await fetch(apiUrl("documents"));
  if (!response.ok) throw new Error("Could not load your documents.");
  return await response.json() as DocumentRecord[];
}

export default function KnowledgeBase({
  onAnswerGenerated,
}: {
  onAnswerGenerated: (answer: RAGAnswerForEvaluation) => void;
}) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [question, setQuestion] = useState("");
  const [ragAnswer, setRagAnswer] = useState<RagAnswer | null>(null);
  const [ragError, setRagError] = useState("");
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    let active = true;
    requestDocuments().then((items) => {
      if (active) setDocuments(items);
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : "Could not reach the backend.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function uploadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setMessage("");
    if (file.size > 10 * 1024 * 1024) { setError("Files must be 10 MB or smaller."); return; }
    const body = new FormData();
    body.append("file", file);
    setBusy(true);
    try {
      const response = await fetch(apiUrl("documents/upload"), { method: "POST", body });
      const data = await response.json() as { detail?: string };
      if (!response.ok) throw new Error(data.detail ?? "Upload failed.");
      setMessage(file.name + " uploaded.");
      setDocuments(await requestDocuments());
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not upload the file.");
    } finally { setBusy(false); }
  }

  async function deleteDocument(document: DocumentRecord) {
    setError(""); setMessage(""); setBusy(true);
    try {
      const response = await fetch(apiUrl("documents/" + document.id), { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json() as { detail?: string };
        throw new Error(data.detail ?? "Delete failed.");
      }
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      setMessage(document.filename + " deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete the file.");
    } finally { setBusy(false); }
  }

  async function indexDocument(document: DocumentRecord) {
    setError(""); setMessage(""); setBusy(true);
    try {
      const response = await fetch(apiUrl("documents/" + document.id + "/index"), { method: "POST" });
      const data = await response.json() as { detail?: string; chunk_count?: number };
      if (!response.ok) throw new Error(data.detail ?? "Document indexing failed.");
      setDocuments(await requestDocuments());
      setMessage(document.filename + " indexed into " + (data.chunk_count ?? 0) + " chunks.");
    } catch (indexError) {
      setError(indexError instanceof Error ? indexError.message : "Could not index the document.");
    } finally { setBusy(false); }
  }

  async function runSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSearchError(""); setSearching(true); setSearchResults([]);
    try {
      const response = await fetch(apiUrl("search"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, limit: 5 }),
      });
      const data = await response.json() as { results?: SearchResult[]; detail?: string };
      if (!response.ok) throw new Error(data.detail ?? "Search failed.");
      setSearchResults(data.results ?? []);
    } catch (searchRequestError) {
      setSearchError(searchRequestError instanceof Error ? searchRequestError.message : "Could not search documents.");
    } finally { setSearching(false); }
  }

  async function askKnowledgeBase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setRagError(""); setRagAnswer(null); setAsking(true);
    try {
      const response = await fetch(apiUrl("rag/query"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await response.json() as RagAnswer & { detail?: string };
      if (!response.ok) throw new Error(data.detail ?? "Knowledge chat failed.");
      setRagAnswer(data);
      onAnswerGenerated({ question, answer: data.answer });
    } catch (ragRequestError) {
      setRagError(ragRequestError instanceof Error ? ragRequestError.message : "Could not answer from documents.");
    } finally { setAsking(false); }
  }

  return (
    <section className="mt-8">
      <div className="rounded-2xl border border-dashed border-indigo-300 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="font-semibold">Upload a document</h2><p className="mt-1 text-sm text-slate-500">PDF, TXT, or Markdown · up to 10 MB</p></div>
          <label className={"cursor-pointer rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 " + (busy ? "pointer-events-none opacity-50" : "")}>
            {busy ? "Working…" : "Choose file"}
            <input type="file" accept=".pdf,.txt,.md,.markdown" onChange={uploadFile} disabled={busy} className="sr-only" />
          </label>
        </div>
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {message && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Documents <span className="text-sm font-normal text-slate-400">({documents.length})</span></h2>
        {loading ? <p className="mt-4 text-sm text-slate-500">Loading documents…</p> : documents.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 text-center"><p className="text-sm font-medium text-slate-700">No documents yet</p><p className="mt-1 text-sm text-slate-500">Uploaded files will appear here.</p></div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {documents.map((document) => <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{document.filename}</p><p className="mt-1 text-xs text-slate-500">{(document.size_bytes / 1024).toFixed(1)} KB · {new Date(document.uploaded_at).toLocaleString()}</p></div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{document.indexed ? document.chunk_count + " chunks" : "Not indexed"}</span>
                {!document.indexed && <button type="button" onClick={() => indexDocument(document)} disabled={busy} className="rounded-lg px-3 py-1.5 text-sm text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">Index</button>}
                <button type="button" onClick={() => deleteDocument(document)} disabled={busy} className="rounded-lg px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-50">Delete</button>
              </div>
            </li>)}
          </ul>
        )}
      </div>
      <p className="mt-5 text-xs leading-5 text-slate-500">Indexing extracts text, splits it into chunks, and stores Gemini embeddings in PostgreSQL with pgvector.</p>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-semibold">Semantic search</h2>
          <p className="mt-1 text-sm text-slate-500">Find document passages by meaning, even when they use different words.</p>
          <form onSubmit={runSearch} className="mt-4 flex gap-2">
            <input required minLength={2} maxLength={1000} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search your documents" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
            <button disabled={searching} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{searching ? "Searching…" : "Search"}</button>
          </form>
          {searchError && <p role="alert" className="mt-3 text-sm text-rose-700">{searchError}</p>}
          {searchResults.length > 0 && <ul className="mt-4 space-y-3">{searchResults.map((item, index) => <li key={item.document_id + ":" + index} className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold text-indigo-700">{item.filename}{item.page_number ? ", page " + item.page_number : ""} · distance {item.distance.toFixed(3)}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-slate-700">{item.content}</p>
          </li>)}</ul>}
          {searchResults.length === 0 && searchQuery && !searching && !searchError && <p className="mt-3 text-sm text-slate-500">No indexed passages matched that search.</p>}
          <p className="mt-3 text-xs text-slate-400">Distance is lower for closer matches.</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-semibold">Ask your documents</h2>
          <p className="mt-1 text-sm text-slate-500">Answers use retrieved excerpts and show their source documents.</p>
          <form onSubmit={askKnowledgeBase} className="mt-4 space-y-2">
            <textarea required minLength={2} maxLength={2000} rows={3} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question about the indexed documents" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
            <button disabled={asking} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{asking ? "Looking it up…" : "Ask"}</button>
          </form>
          {ragError && <p role="alert" className="mt-3 text-sm text-rose-700">{ragError}</p>}
          {ragAnswer && <div aria-live="polite" className="mt-4 border-t border-slate-100 pt-4">
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{ragAnswer.answer}</p>
            {ragAnswer.sources.length > 0 && <div className="mt-4"><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Retrieved sources</h3><ul className="mt-2 space-y-2">{ragAnswer.sources.map((source, index) => <li key={source.filename + ":" + index} className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600"><p className="font-semibold">{source.filename}{source.page_number ? ", page " + source.page_number : ""}</p><p className="mt-1 line-clamp-4">{source.excerpt}</p></li>)}</ul></div>}
            <a href="#rag-evaluation" className="mt-4 inline-flex text-sm font-medium text-indigo-700 hover:underline">Evaluate this answer ↓</a>
          </div>}
        </section>
      </div>
    </section>
  );
}
