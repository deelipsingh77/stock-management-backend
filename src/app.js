import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

app.use(express.static("public"));
app.use(cookieParser());

//Routes Import
import userRouter from "./routes/user.routes.js";

//Routes Declaration
app.use("/api/v1/users", userRouter);

// Error-handling middleware
app.use((err, req, res, next) => {
  // Only handle errors if no response has been sent yet
  if (!res.headersSent) {
    console.error(err);

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
      success: false,
      statusCode,
      message: err.message || "Internal Server Error",
      errors: err.errors || [],
    });
  } else {
    // If headers have already been sent, we log the error but don't attempt to send another response
    console.error("Headers already sent:", err);
  }
});

export default app;
