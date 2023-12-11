const mongoose = require("mongoose");
const Department = require("./Department.js");
const Role_type = require("./Role_type.js");

const { Schema } = mongoose;

const UserSchema = new Schema({
  profile: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  mobile_no: {
    type: Number,
    required: true,
  },
  whatsapp_status: {
    type: Boolean,
    default: false,
  },
  whatsapp_no: {
    type: Number,
  },
  instagram: {
    type: String,
  },
  facebook: {
    type: String,
  },
  department: {
    type: "ObjectId",
    ref: "Department",
    required: true,
  },
  role_type: {
    type: "ObjectId",
    ref: "Role_type",
    required: true,
  },
  createDate: {
    type: Date,
    default: Date.now,
  },
  approved: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("User", UserSchema);
