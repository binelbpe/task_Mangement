const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.pre("findOneAndDelete", async function () {
  try {
    const doc = await this.model.findOne(this.getQuery());
    if (doc) {
      const Task = mongoose.model("Task");
      const result = await Task.deleteMany({ user: doc._id });
      console.log(`Deleted ${result.deletedCount} tasks for user ${doc._id}`);
    }
  } catch (error) {
    console.error("Error in pre-delete middleware:", error);
    throw error;
  }
});

userSchema.pre(
  "deleteOne",
  { document: false, query: true },
  async function () {
    try {
      const doc = await this.model.findOne(this.getQuery());
      if (doc) {
        const Task = mongoose.model("Task");
        const result = await Task.deleteMany({ user: doc._id });
        console.log(`Deleted ${result.deletedCount} tasks for user ${doc._id}`);
      }
    } catch (error) {
      console.error("Error in deleteOne middleware:", error);
      throw error;
    }
  }
);

module.exports = mongoose.model("User", userSchema);
