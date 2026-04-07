const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const uploadsDir = path.join(__dirname, "uploads");

// Ensure uploads folder exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf"
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error("Only PDF, JPG, PNG, WEBP, and GIF files are allowed"));
    }
    cb(null, true);
  }
});

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Schemas
const UserSchema = new mongoose.Schema({
  email: String,
  password: String
});

const BadgeSchema = new mongoose.Schema({
  userId: String,
  title: String,
  skill: String,
  organization: String,
  date: String,
  imageUrl: String,
  fileType: String,
  fileName: String
});

const User = mongoose.model("User", UserSchema);
const Badge = mongoose.model("Badge", BadgeSchema);

// Middleware
const auth = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ msg: "No token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ msg: "Invalid token" });
    req.userId = decoded.id;
    next();
  });
};

// Routes
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ email, password: hashed });
    res.json({ msg: "Registered" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ msg: "Unable to register user" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token, userId: user._id });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Unable to log in" });
  }
});

// Upload badge with image
app.post("/badge", auth, upload.single("image"), async (req, res) => {
  try {
    const imageUrl = req.file
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
      : "";

    await Badge.create({
      ...req.body,
      userId: req.userId,
      imageUrl,
      fileType: req.file?.mimetype || "",
      fileName: req.file?.originalname || ""
    });

    res.json({ msg: "Badge added" });
  } catch (err) {
    console.error("Badge upload error:", err);
    res.status(500).json({ msg: err.message || "Unable to upload badge" });
  }
});

app.get("/badge", auth, async (req, res) => {
  try {
    const badges = await Badge.find({ userId: req.userId });
    res.json(badges);
  } catch (err) {
    console.error("Badge fetch error:", err);
    res.status(500).json({ msg: "Unable to fetch badges" });
  }
});

app.delete("/badge/:id", auth, async (req, res) => {
  try {
    await Badge.findByIdAndDelete(req.params.id);
    res.json({ msg: "Deleted" });
  } catch (err) {
    console.error("Badge delete error:", err);
    res.status(500).json({ msg: "Unable to delete badge" });
  }
});

// NEW PUBLIC ROUTE: Get badges for shared view
app.get("/shared/:userId", async (req, res) => {
  try {
    const badges = await Badge.find({ userId: req.params.userId });
    res.json(badges);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching shared badges" });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ msg: err.message });
  }

  if (err) {
    console.error("Unhandled server error:", err);
    return res.status(500).json({ msg: err.message || "Server error" });
  }

  next();
});

app.listen(5000, () => console.log("Server running on 5000"));
