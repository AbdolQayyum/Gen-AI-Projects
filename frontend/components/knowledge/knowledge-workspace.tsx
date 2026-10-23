"use client";

import { useState } from "react";
import Evaluations from "@/components/evaluations/evaluations";
import KnowledgeBase from "@/components/knowledge/knowledge-base";

type AnswerToEvaluate = { question: string; answer: string };

export default function KnowledgeWorkspace() {
  const [sourceAnswer, setSourceAnswer] = useState<AnswerToEvaluate | null>(null);

  return (
    <>
      <KnowledgeBase onAnswerGenerated={setSourceAnswer} />
      <section
        id="rag-evaluation"
        aria-labelledby="rag-evaluation-title"
        className="mt-12 border-t border-slate-200 pt-8"
      >
        <h2 id="rag-evaluation-title" className="text-xl font-semibold tracking-tight">
          Evaluate RAG quality
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Check how well retrieval and generated answers perform against a reference answer.
        </p>
        <Evaluations sourceAnswer={sourceAnswer} />
      </section>
    </>
  );
}
