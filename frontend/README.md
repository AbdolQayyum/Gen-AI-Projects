This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
The home route is the dashboard. Open [http://localhost:3000/chat](http://localhost:3000/chat) to use the chat page.

## AI Chat setup

The browser sends requests to the FastAPI backend at `http://localhost:8000/api/v1` by default. To use a different backend URL, set `NEXT_PUBLIC_API_BASE_URL` in `.env.local`.

Set the selected chat provider key in `backend/.env` (Groq by default). Start FastAPI and Next.js in separate terminals. Conversation history is kept in the current browser session and is not saved yet. Document indexing and RAG also need `GOOGLE_API_KEY` for Gemini embeddings.

The `/tools` page provides summarization, email drafting, resume review, and
meeting-notes formatting. The `/knowledge` page supports document upload and
deletion, indexing, semantic search, question answering with source excerpts,
and RAG quality evaluation against a reference answer. The answer from document
Q&A is prefilled so the exact response can be evaluated. Evaluation history is
shown alongside the knowledge-base workflow; `/evaluations` redirects there.
Start the repository's PostgreSQL + pgvector service with `docker compose up -d postgres`
before indexing documents.

The `/assistant` page uses the LangGraph support workflow and can call the
calculator, UTC clock, and knowledge search tools.

The `/agents` page demonstrates a small LangGraph orchestrator that selects a
RAG, support, or document analysis agent for each request. Paste document text
when asking the document agent to summarize or analyze it.

RAG evaluation stores the retrieved context, generated answer, reference answer,
and judge scores. The backend can optionally send these traces to LangSmith when
enabled in `backend/.env`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

The frontend uses system fonts so production builds do not need to fetch font files from an external service.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
