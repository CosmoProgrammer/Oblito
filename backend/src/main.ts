import { inspect } from 'util';

process.on('uncaughtException', (err) => {
  try {
    console.error('uncaughtException:', inspect(err, { showHidden: true, depth: 6 }));
    if ((err as any)?.stack) console.error('stack:', (err as any).stack);
  } catch (e) {
    console.error('Failed to print uncaughtException:', e);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  try {
    console.error('unhandledRejection:', inspect(reason, { showHidden: true, depth: 6 }));
    if ((reason as any)?.stack) console.error('stack:', (reason as any).stack);
  } catch (e) {
    console.error('Failed to print unhandledRejection:', e);
  }
});

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import passport from "passport";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth-routes.js";
import productRoutes from "./routes/product-routes.js";
import categoryRoutes from "./routes/category-routes.js";
import inventoryRoutes from "./routes/inventory-routes.js";
import cartRoutes from "./routes/cart-routes.js";
import orderRoutes from "./routes/order-routes.js";
import userRoutes from "./routes/user-routes.js";
import addressRoutes from "./routes/address-routes.js";

import "../passport-config.js";

const app = express();

dotenv.config();

const port = process.env.PORT || 8000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.use(cookieParser());
app.use(passport.initialize());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use("/", authRoutes);
app.use("/", productRoutes);
app.use("/", categoryRoutes);
app.use("/", inventoryRoutes);
app.use("/", cartRoutes);
app.use("/", orderRoutes);
app.use("/", userRoutes);
app.use("/", addressRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});