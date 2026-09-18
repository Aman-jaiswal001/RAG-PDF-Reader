import express from "express";
import "dotenv/config";
import cors from "cors";

import authRoutes from "./routes/authRoute.js";
import chatRoutes from "./routes/chatRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

import { connectMongoDB } from "./config/db.js";
import { initializeQdrant } from "./config/qdrant.js";

const app = express();
const PORT = process.env.PORT || 5000;

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(cors());
app.use(express.json());

await connectMongoDB();

// Initialize Qdrant
await initializeQdrant();

// --------------------------------------------------
// Routes
// --------------------------------------------------

app.get("/", (req, res) => {
  res.send("🚀 RAG server is running...");
});

app.use("/auth", authRoutes);
app.use("/chats", chatRoutes);
app.use("/documents", documentRoutes);
app.use("/ai", aiRoutes);

// --------------------------------------------------
// Start Server
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(`\n🚀 RAG server running on http://localhost:${PORT}`);
});
