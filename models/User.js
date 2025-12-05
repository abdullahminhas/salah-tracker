import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false, // Don't return password by default
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre("save", async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return;
  }
  
  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
});

// Method to compare password
// Note: When using this method, make sure to select the password field
// Example: User.findOne({ email }).select('+password')
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    throw new Error("Password not available. Make sure to select password field.");
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Prevent model re-compilation during hot reloads
const User = mongoose.models.users || mongoose.model("users", UserSchema, "users");

export default User;

