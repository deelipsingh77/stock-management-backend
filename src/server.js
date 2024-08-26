import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({ path: `./.env` });

connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.log("Express Error", err);
    });

    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("Mongo DB Connection Failed", err);
  });
