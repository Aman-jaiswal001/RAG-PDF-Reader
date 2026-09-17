import express from "express";

import {
  createChat,
  getChats,
  getChatMessages,
  deleteChat,
} from "../controllers/chatController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createChat);

router.get("/", protect, getChats);

router.get(
  "/:sessionId/messages",
  protect,
  getChatMessages
);

router.delete(
  "/:sessionId",
  protect,
  deleteChat
);

export default router;