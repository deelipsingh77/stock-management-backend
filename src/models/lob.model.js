import mongoose, { Schema } from "mongoose";

const lobSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

const Lob = mongoose.model("Lob", lobSchema);

export default Lob;
