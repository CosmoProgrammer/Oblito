import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import passport from "passport";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth-routes.js";
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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});