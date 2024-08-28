import mongoose, { Schema } from "mongoose";

const zoneSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

const Zone = mongoose.model("Zone", zoneSchema);

export default Zone;
