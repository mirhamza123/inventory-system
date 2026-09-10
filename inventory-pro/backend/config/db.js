import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/inventory-pro",
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
// PORT=5000
// MONGO_URI=mongodb://127.0.0.1:27017/inventory-pro
// JWT_SECRET=inventory-pro-secret-key
// # discout  option  add
