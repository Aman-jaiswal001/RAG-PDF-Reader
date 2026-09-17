import express from "express";
import "dotenv/config";

import cors from "cors";
import authRoutes from "./routes/authRoute.js";
import chatRoutes from "./routes/chatRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import {connectMongoDB} from './config/db.js'
import {initializeQdrant} from './config/qdrant.js'

const app = express();
const port = 5000;


// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(cors());
app.use(express.json());
await connectMongoDB();
await initializeQdrant();


app.use("/auth", authRoutes);

app.use("/chats", chatRoutes);

app.use("/documents", documentRoutes);

app.use("/ai", aiRoutes);

app.get('/',(req,res) => res.send('server is running....'))


// --------------------------------------------------
// Start Server
// --------------------------------------------------


app.listen(port, () => {
  console.log(`\n🚀 RAG server running on http://localhost:${port}`);
});
