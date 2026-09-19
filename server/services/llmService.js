import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const groqLLM = process.env.GROQ_API_KEY
  ? new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "openai/gpt-oss-120b",
      temperature: 0,
    })
  : null;

const geminiLLM = process.env.GOOGLE_API_KEY
  ? new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-2.5-flash",
      temperature: 0,
    })
  : null;

export const invokeLLM = async (messages) => {
  let groqError = null;

  // 1️⃣ Try Groq first
  if (groqLLM) {
    try {
      // console.log("🤖 Trying Groq...");

      const response = await groqLLM.invoke(messages);

      // console.log("✅ Groq response received");

      return {
        response,
        provider: "groq",
      };
    } catch (error) {
      groqError = error;

      console.error("❌ Groq failed:", error.message);
      // console.log("🔄 Switching to Gemini...");
    }
  } else {
    // console.log("⚠️ GROQ_API_KEY not available");
  }

  // 2️⃣ Fallback to Gemini
  if (geminiLLM) {
    try {
      // console.log("🤖 Trying Gemini...");

      const response = await geminiLLM.invoke(messages);

      // console.log("✅ Gemini response received");

      return {
        response,
        provider: "gemini",
      };
    } catch (geminiError) {
      console.error("❌ Gemini failed:", geminiError.message);

      throw new Error(
        `Both LLM providers failed. Groq: ${
          groqError?.message || "Unavailable"
        }. Gemini: ${geminiError.message}`
      );
    }
  }

  throw new Error(
    "No LLM provider is configured. Please provide GROQ_API_KEY or GOOGLE_API_KEY."
  );
};