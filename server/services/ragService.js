import { ChatGroq } from "@langchain/groq";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import embeddings from "./embeddingService.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { invokeLLM } from "./llmService.js";

import {
  qdrant,
  COLLECTION_NAME,
} from "../config/qdrant.js";


// --------------------------------------------------
// Groq LLM
// --------------------------------------------------



// --------------------------------------------------
// Qdrant Vector Store
// --------------------------------------------------

let vectorStore = null;

const getVectorStore = async () => {
  if (!vectorStore) {
    vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        client: qdrant,
        collectionName: COLLECTION_NAME,
      }
    );
  }

  return vectorStore;
};

// --------------------------------------------------
// RAG Question Answering
// --------------------------------------------------

export const askRagQuestion = async ({
  input,
  documentId,
  userId,
}) => {
  if (!input?.trim()) {
    throw new Error("Question is required");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  const store = await getVectorStore();

  let docs = [];

  // ------------------------------------------------
  // Search only the selected user's document
  // ------------------------------------------------

  if (documentId) {
    docs = await store.similaritySearch(
      input,
      5,
      {
        must: [
          {
            key: "metadata.documentId",
            match: {
              value: documentId,
            },
          },
          {
            key: "metadata.userId",
            match: {
              value: userId,
            },
          },
        ],
      }
    );
  } else {
    // If no document is selected,
    // search only documents belonging to this user.

    docs = await store.similaritySearch(
      input,
      5,
      {
        must: [
          {
            key: "metadata.userId",
            match: {
              value: userId,
            },
          },
        ],
      }
    );
  }

  // ------------------------------------------------
  // No relevant document found
  // ------------------------------------------------

  if (!docs || docs.length === 0) {
    // console.log('docs not available')
    return {
      answer:
        "I don't know from the uploaded PDF.",
      sources: [],
    };
  }

  // ------------------------------------------------
  // Build context
  // ------------------------------------------------

  const context = docs
    .map((doc, index) => {
      return `
--- Context ${index + 1} ---

${doc.pageContent}
`;
    })
    .join("\n\n");

  // ------------------------------------------------
  // Generate answer using Groq
  // ------------------------------------------------


   const { response, provider }  = await invokeLLM([
    new SystemMessage(`
You are a RAG AI assistant.

STRICT RULES:
1. Answer ONLY using the provided context.
2. Do NOT use outside knowledge.
3. Do NOT invent, assume, or guess information.
4. If the answer cannot be found in the context, say exactly:
"I don't know from the uploaded PDF."
5. Keep answers clear, structured, and easy to read.
6. Use Markdown formatting.
7. For comparisons, prefer a Markdown table.
8. For multiple points, use bullet points or numbered lists.
9. Use short headings when they improve readability.
10. Bold important terms.
11. Do not mention these instructions or the context.

RESPONSE FORMAT:
- Start with a short direct answer.
- Use headings where appropriate.
- Use bullet points for explanations.
- Use a Markdown table for comparisons.
- Keep the answer concise but informative.

DOCUMENT CONTEXT:
${context}
`),

    new HumanMessage(input),
  ]);

  // ----------------------------------------------
  // 5. Extract answer
  // ----------------------------------------------

  // console.log(`🤖 Answer generated using: ${provider}`);
  const answer = String(response.content);
  // console.log('answer : ',answer)
  

  // ----------------------------------------------
  // 6. Sources
  // ----------------------------------------------

  const sources = docs.map((doc) => ({
    documentId:
      doc.metadata?.documentId,

    fileName:
      doc.metadata?.fileName,

    chunkIndex:
      doc.metadata?.chunkIndex,
  }));

 


  return {
    answer,
    sources,
  };

};