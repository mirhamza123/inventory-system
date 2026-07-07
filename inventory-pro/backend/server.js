import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get("/api/health", (_req, res) => {
  res.json({ message: "Inventory Pro API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stock", stockRoutes);

const startServer = (port = Number(process.env.PORT) || 5000, attempt = 1) => {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      const nextPort = port + 1;
      console.warn(`Port ${port} is busy. Trying ${nextPort}...`);
      server.close();

      if (attempt < 5) {
        startServer(nextPort, attempt + 1);
      } else {
        console.error(
          "Could not find an available port after multiple attempts.",
        );
        process.exit(1);
      }
      return;
    }

    console.error(error);
    process.exit(1);
  });
};

startServer();
