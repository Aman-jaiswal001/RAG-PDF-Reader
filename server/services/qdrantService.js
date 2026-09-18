// src/services/qdrantService.js

import { QdrantVectorStore } from "@langchain/qdrant";

import {
  qdrant,
  COLLECTION_NAME,
} from "../config/qdrant.js";

import embeddings from "./embeddingService.js";

// --------------------------------------------------
// Get Vector Store
// --------------------------------------------------

let vectorStore = null;

export const getVectorStore = async () => {
  if (!vectorStore) {
    vectorStore =
      await QdrantVectorStore.fromExistingCollection(
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
// Add Documents
// --------------------------------------------------

export const addDocumentsToQdrant = async (
  documents
) => {
  const vectorStore = await getVectorStore();

  await vectorStore.addDocuments(documents);

  return true;
};

// --------------------------------------------------
// Search Documents
// --------------------------------------------------

export const searchDocuments = async ({
  query,
  userId,
  documentId,
  limit = 5,
}) => {
  const vectorStore = await getVectorStore();

  let filter = {
    must: [
      {
        key: "metadata.userId",
        match: {
          value: userId,
        },
      },
    ],
  };

  // If a specific PDF is selected
  if (documentId) {
    filter.must.push({
      key: "metadata.documentId",
      match: {
        value: documentId,
      },
    });
  }

  const docs =
    await vectorStore.similaritySearch(
      query,
      limit,
      filter
    );
    // console.log('docs : ',docs);

  return docs;
};

// --------------------------------------------------
// Delete Document Chunks
// --------------------------------------------------

export const deleteDocumentChunks = async ({
  documentId,
  userId,
}) => {
  try {
    const pointIds = [];

    let offset = null;

    do {
      const result = await qdrant.scroll(
        COLLECTION_NAME,
        {
          limit: 100,
          offset,
          with_payload: true,
          with_vector: false,
        }
      );

      for (const point of result.points) {
        const payload = point.payload || {};

        const metadata =
          payload.metadata || payload;

        if (
          metadata.documentId === documentId &&
          metadata.userId === userId
        ) {
          pointIds.push(point.id);
        }
      }

      offset = result.next_page_offset;
    } while (offset !== null);

    // console.log(
    //   `🔎 Found ${pointIds.length} chunks for document ${documentId}`
    // );

    // Nothing to delete
    if (pointIds.length === 0) {
      return {
        deletedChunks: 0,
      };
    }

    // Delete exact Qdrant points
    await qdrant.delete(
      COLLECTION_NAME,
      {
        wait: true,
        points: pointIds,
      }
    );

    // console.log(
    //   `✅ Deleted ${pointIds.length} Qdrant chunks`
    // );

    return {
      deletedChunks: pointIds.length,
    };

  } catch (error) {
    console.error(
      "❌ QDRANT DELETE ERROR:",
      error
    );

    throw error;
  }
};