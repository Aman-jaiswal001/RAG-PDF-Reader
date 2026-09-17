import mongoose from 'mongoose'

export const connectMongoDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/Rag-app`);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:");
    console.error(error);
    process.exit(1);
  }
}