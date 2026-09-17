import { QdrantClient } from "@qdrant/js-client-rest";

export const COLLECTION_NAME = "rag_documents";

export const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

export const initializeQdrant = async () => {
  try {
    const collections = await qdrant.getCollections();

    const exists = collections.collections.some(
      (collection) => collection.name === COLLECTION_NAME
    );

    if (!exists) {
      // console.log(
      //   `⚠️ Qdrant collection "${COLLECTION_NAME}" does not exist`
      // );

      return;
    }

    // console.log(
    //   `✅ Qdrant collection "${COLLECTION_NAME}" exists`
    // );

    // Create userId payload index
    try {
      await qdrant.createPayloadIndex(COLLECTION_NAME, {
        field_name: "metadata.userId",
        field_schema: "keyword",
      });

      // console.log("✅ Qdrant index created: metadata.userId");
    } catch (error) {
      if (error.message?.toLowerCase().includes("already exists")) {
        // console.log("✅ Qdrant index already exists: metadata.userId");
      } else {
        throw error;
      }
    }

    // Create documentId payload index
    try {
      await qdrant.createPayloadIndex(COLLECTION_NAME, {
        field_name: "metadata.documentId",
        field_schema: "keyword",
      });

      // console.log("✅ Qdrant index created: metadata.documentId");
    } catch (error) {
      if (error.message?.toLowerCase().includes("already exists")) {
        // console.log(
        //   "✅ Qdrant index already exists: metadata.documentId"
        // );
      } else {
        throw error;
      }
    }

    // console.log("✅ Qdrant initialization completed");
  } catch (error) {
    console.error("❌ Qdrant initialization failed");
    console.error(error.message);

    throw error;
  }
};