import mongoose, { Schema } from "mongoose";

const branchSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

const Branch = mongoose.model("Branch", branchSchema);

export default Branch;
