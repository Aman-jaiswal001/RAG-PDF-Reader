import { ChatSession } from "../models/ChatSession.js";
import { ChatMessage } from "../models/ChatMessage.js";

import { askRagQuestion } from "../services/ragService.js";

export const askQuestion = async (req, res) => {
  try {
    const {
      input,
      documentId,
      sessionId,
    } = req.body;

    if (!input?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    let session = null;

    // ----------------------------------------------
    // Verify chat belongs to logged-in user
    // ----------------------------------------------

    if (sessionId) {
      session = await ChatSession.findOne({
        _id: sessionId,
        userId: req.user.userId,
      });

      if (!session) {
        // console.log('chat session not found aiController-36');
        return res.status(404).json({
          success: false,
          message: "Chat session not found",
        });
      }
    }

    // ----------------------------------------------
    // RAG
    // ----------------------------------------------

    const result = await askRagQuestion({
      input,
      documentId,
      userId: req.user.userId,
    });

    // ----------------------------------------------
    // Save messages
    // ----------------------------------------------

    if (session) {
      await ChatMessage.create({
        sessionId: session._id,
        role: "user",
        content: input,
      });

      await ChatMessage.create({
        sessionId: session._id,
        role: "assistant",
        content: result.answer,
        sources: result.sources,
      });

      session.updatedAt = new Date();

      await session.save();
    }

    // ----------------------------------------------
    // Response
    // ----------------------------------------------

    return res.status(200).json({
      success: true,
      answer: result.answer,
      sources: result.sources,
    });

  } catch (error) {
    console.error("AI CONTROLLER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "AI request failed",
      error: error.message,
    });
  }
};