import { ChatSession } from "../models/ChatSession.js";
import { ChatMessage } from "../models/ChatMessage.js";

export const createChat = async (req, res) => {
  try {
    const {
      title,
      documentIds = [],
    } = req.body;

    const chat = await ChatSession.create({
      userId: req.user.userId,
      title: title || "New chat",
      documentIds,
    });

    res.status(201).json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error("CREATE CHAT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create chat",
    });
  }
};

export const getChats = async (req, res) => {
  try {
    const chats = await ChatSession.find({
      userId: req.user.userId,
    }).sort({
      updatedAt: -1,
    });

    res.status(200).json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error("GET CHATS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch chats",
    });
  }
};

export const getChatMessages = async (
  req,
  res
) => {
  try {
    const { sessionId } = req.params;

    const chat = await ChatSession.findOne({
      _id: sessionId,
      userId: req.user.userId,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const messages = await ChatMessage.find({
      sessionId,
    }).sort({
      createdAt: 1,
    });

    res.status(200).json({
      success: true,
      chat,
      messages,
    });
  } catch (error) {
    console.error(
      "GET CHAT MESSAGES ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
};

export const deleteChat = async (
  req,
  res
) => {
  try {
    const { sessionId } = req.params;

    const chat = await ChatSession.findOne({
      _id: sessionId,
      userId: req.user.userId,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const result =
      await ChatMessage.deleteMany({
        sessionId,
      });

    await ChatSession.findByIdAndDelete(
      sessionId
    );

    res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
      deletedMessages:
        result.deletedCount,
    });
  } catch (error) {
    console.error("DELETE CHAT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete chat",
    });
  }
};