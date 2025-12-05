import mongoose from "mongoose";

const uri = "mongodb+srv://thakkarprerak5_db_user:Prerak%402005@cluster0.c2rnetx.mongodb.net/?appName=Cluster0";

async function connectDB() {
  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected Successfully!");
  } catch (err) {
    console.error("❌ Error connecting to MongoDB:", err.message);
  }
}

connectDB();
