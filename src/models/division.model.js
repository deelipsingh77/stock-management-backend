import mongoose, { Schema } from "mongoose";

const divisionSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

const Division = mongoose.model("Division", divisionSchema);

export default Division;
