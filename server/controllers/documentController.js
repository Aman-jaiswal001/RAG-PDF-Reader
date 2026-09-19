import {qdrant,COLLECTION_NAME} from '../config/qdrant.js'
import crypto from "crypto";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { QdrantVectorStore } from "@langchain/qdrant";
import embeddings from "../services/embeddingService.js"
import { ChatSession } from "../models/ChatSession.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { Document } from "../models/Document.js";

import fs from "fs/promises";
import os from "os";
import path from "path";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

import {
  deleteDocumentChunks
} from "../services/qdrantService.js";



let vectorStore = null;
export const getDocuments = async (req, res) => {
  try {
    // console.log('getDocument called')
    const collectionInfo = await qdrant.getCollections();

    const collectionExists = collectionInfo.collections.some(
      (collection) => collection.name === COLLECTION_NAME
    );

    if (!collectionExists) {
      return res.status(200).json({
        success: true,
        documents: [],
      });
    }

    const userId = req.user.userId;
    // console.log('userId : ',userId)

    const documents = new Map();
    let offset = null;

    do {
      const result = await qdrant.scroll(COLLECTION_NAME, {
        limit: 100,
        offset,
        with_payload: true,
        with_vector: false,

        // Only get this user's document chunks
        filter: {
          must: [
            {
              key: "metadata.userId",
              match: {
                value: userId,
              },
            },
          ],
        },
      });

      for (const point of result.points) {
        const payload = point.payload || {};
        const metadata = payload.metadata || payload;

        const documentId = metadata.documentId;
        const fileName = metadata.fileName;

        if (!documentId || !fileName) {
          continue;
        }

        if (documents.has(documentId)) {
          documents.get(documentId).chunks += 1;
        } else {
          documents.set(documentId, {
            documentId,
            fileName,
            uploadedAt: metadata.uploadedAt || null,
            chunks: 1,
          });
        }
      }

      offset = result.next_page_offset;
    } while (offset !== null);

    return res.status(200).json({
      success: true,
      documents: Array.from(documents.values()),
    });
  } catch (error) {
    console.error("DOCUMENT LIST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get documents",
      error: error.message,
    });
  }
};

export const uploadDocument = async (req, res) => {
  let tempFilePath = null;

  try {
    // ----------------------------------------------
    // 1. Validate uploaded file
    // ----------------------------------------------

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF file",
      });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({
        success: false,
        message: "Only PDF files are allowed",
      });
    }

    console.log(`📄 Uploading: ${req.file.originalname}`);

    // ----------------------------------------------
    // 2. Generate unique document ID
    // ----------------------------------------------

    const documentId = crypto.randomUUID();

    const uploadedAt = new Date().toISOString();

    // ----------------------------------------------
    // 3. Create temporary PDF file
    // ----------------------------------------------

    tempFilePath = path.join(
      os.tmpdir(),
      `${documentId}.pdf`
    );

    await fs.writeFile(
      tempFilePath,
      req.file.buffer
    );

    console.log("📁 Temporary PDF created");

    // ----------------------------------------------
    // 4. Load PDF using LangChain PDFLoader
    // ----------------------------------------------

    const loader = new PDFLoader(tempFilePath);

    const pdfDocuments = await loader.load();

    console.log(
      `📄 PDF pages loaded: ${pdfDocuments.length}`
    );

    // ----------------------------------------------
    // 5. Extract text
    // ----------------------------------------------

    const hasText = pdfDocuments.some(
      (doc) => doc.pageContent?.trim()
    );

    if (!hasText) {
      return res.status(400).json({
        success: false,
        message: "Could not extract text from this PDF",
      });
    }

    // ----------------------------------------------
    // 6. Split PDF documents into chunks
    // ----------------------------------------------

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await splitter.splitDocuments(
      pdfDocuments
    );

    console.log(
      `🧩 Created chunks: ${docs.length}`
    );

    // ----------------------------------------------
    // 7. Add metadata to every chunk
    // ----------------------------------------------

    docs.forEach((doc, index) => {
      doc.metadata = {
        ...doc.metadata,

        documentId,
        userId: req.user.userId,
        fileName: req.file.originalname,
        chunkIndex: index,
        uploadedAt,
      };
    });

    // ----------------------------------------------
    // 8. Create / update Qdrant vector store
    // ----------------------------------------------

    if (!vectorStore) {
      console.log("🔵 Creating Qdrant vector store...");

      vectorStore = await QdrantVectorStore.fromDocuments(
        docs,
        embeddings,
        {
          url: process.env.QDRANT_URL,
          apiKey: process.env.QDRANT_API_KEY,
          collectionName: COLLECTION_NAME,
        }
      );

      console.log("✅ Qdrant collection created");
    } else {
      console.log("🟢 Adding chunks to Qdrant...");

      await vectorStore.addDocuments(docs);

      console.log(
        `✅ Added ${docs.length} chunks to Qdrant`
      );
    }

    // ----------------------------------------------
    // 9. Save document metadata in MongoDB
    // ----------------------------------------------

    const savedDocument = await Document.create({
      userId: req.user.userId,
      documentId,
      fileName: req.file.originalname,
      chunkCount: docs.length,
    });

    console.log(
      `✅ Document saved: ${savedDocument._id}`
    );

    // ----------------------------------------------
    // 10. Response
    // ----------------------------------------------

    return res.status(201).json({
      success: true,
      message: "PDF uploaded and indexed successfully",

      document: {
        _id: savedDocument._id,
        documentId: savedDocument.documentId,
        fileName: savedDocument.fileName,
        chunkCount: savedDocument.chunkCount,
        uploadedAt: savedDocument.createdAt,
      },
    });

  } catch (error) {
    console.error("❌ UPLOAD ERROR:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to process PDF",
      error: error.message,
    });

  } finally {
    // ----------------------------------------------
    // 11. Delete temporary PDF
    // ----------------------------------------------

    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);

        console.log("🗑️ Temporary PDF deleted");
      } catch (error) {
        console.error(
          "⚠️ Failed to delete temporary PDF:",
          error.message
        );
      }
    }
  }  
};

export const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const userId = req.user.userId;

    // Find document belonging to logged-in user
    const document = await Document.findOne({
      documentId,
      userId,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Delete vectors from Qdrant
    const result = await deleteDocumentChunks({
      documentId,
      userId,
    });

    // Delete document metadata from MongoDB
    await Document.deleteOne({
      documentId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
      documentId,
      deletedChunks: result.deletedChunks,
    });

  } catch (error) {
    console.error(
      "DELETE DOCUMENT CONTROLLER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete document",
    });
  }
};