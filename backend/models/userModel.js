const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minLength: 4,
        maxLength: 30
    },
    email: {
        type: String,
        unique: true,
        required: true, 
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
  
role: {
    type: String,
    enum: ["client", "admin"],
    default: "client"
}

})

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});


const User = mongoose.model("User", userSchema);

module.exports = User;