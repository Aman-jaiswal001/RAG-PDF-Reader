// src/services/chatService.js

import { ChatSession } from "../models/ChatSession.js";
import { ChatMessage } from "../models/ChatMessage.js";

// --------------------------------------------------
// Create Chat
// --------------------------------------------------

export const createChat = async ({
  userId,
  title = "New chat",
  documentIds = [],
}) => {
  const chat = await ChatSession.create({
    userId,
    title,
    documentIds,
  });

  return chat;
};

// --------------------------------------------------
// Get User Chats
// --------------------------------------------------

export const getUserChats = async (
  userId
) => {
  const chats = await ChatSession.find({
    userId,
  }).sort({
    updatedAt: -1,
  });

  return chats;
};

// --------------------------------------------------
// Get Chat
// --------------------------------------------------

export const getUserChat = async ({
  sessionId,
  userId,
}) => {
  const chat = await ChatSession.findOne({
    _id: sessionId,
    userId,
  });

  return chat;
};

// --------------------------------------------------
// Get Messages
// --------------------------------------------------

export const getChatMessages = async ({
  sessionId,
  userId,
}) => {
  // First verify ownership
  const chat = await ChatSession.findOne({
    _id: sessionId,
    userId,
  });

  if (!chat) {
    return null;
  }

  const messages = await ChatMessage.find({
    sessionId,
  }).sort({
    createdAt: 1,
  });

  return {
    chat,
    messages,
  };
};

// --------------------------------------------------
// Save Message
// --------------------------------------------------

export const saveChatMessage = async ({
  sessionId,
  role,
  content,
  sources = [],
}) => {
  const message = await ChatMessage.create({
    sessionId,
    role,
    content,
    sources,
  });

  // Update chat timestamp
  await ChatSession.findByIdAndUpdate(
    sessionId,
    {
      updatedAt: new Date(),
    }
  );

  return message;
};

// --------------------------------------------------
// Delete Chat
// --------------------------------------------------

export const deleteChat = async ({
  sessionId,
  userId,
}) => {
  // Verify ownership
  const chat = await ChatSession.findOne({
    _id: sessionId,
    userId,
  });

  if (!chat) {
    return null;
  }

  // Delete messages
  const messageResult =
    await ChatMessage.deleteMany({
      sessionId,
    });

  // Delete session
  await ChatSession.findByIdAndDelete(
    sessionId
  );

  return {
    deletedMessages:
      messageResult.deletedCount,
  };
};

// --------------------------------------------------
// Add Document to Chat
// --------------------------------------------------

export const addDocumentToChat = async ({
  sessionId,
  userId,
  documentId,
}) => {
  const chat = await ChatSession.findOne({
    _id: sessionId,
    userId,
  });

  if (!chat) {
    return null;
  }

  if (!chat.documentIds.includes(documentId)) {
    chat.documentIds.push(documentId);

    await chat.save();
  }

  return chat;
};