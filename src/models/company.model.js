import mongoose, { Schema } from "mongoose";

const companySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

const Company = mongoose.model("Company", companySchema);

export default Company;
