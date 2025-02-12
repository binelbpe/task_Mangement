const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const userRoutes = require("./routes/users");
const User = require("./models/User");
const Task = require("./models/Task");
const { authenticateToken } = require("./middleware/authMiddleware");

dotenv.config();

const app = express();


app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

console.log(process.env.MONGODB_URI);
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

app.delete("/api/admin/users/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const deletedTasks = await Task.deleteMany({ userId: user._id });
    console.log(
      `Deleted ${deletedTasks.deletedCount} tasks for user ${userId}`
    );

    await User.findByIdAndDelete(userId);

    res.json({
      message: "User and associated tasks deleted successfully",
      deletedTasksCount: deletedTasks.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
