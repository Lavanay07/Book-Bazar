const mongoose = require("mongoose");

// Define the User model schema here
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

module.exports = mongoose.model("User", userSchema);
