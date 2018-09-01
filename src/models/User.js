const mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
	name: String,
	pid: String,
	type: String,
	status: String,
	phno: String,
	email: String,
	event: String,
});

module.exports = mongoose.model("User", userSchema);