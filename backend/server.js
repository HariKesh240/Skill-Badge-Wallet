const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

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
  date: String
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
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  await User.create({ email, password: hashed });
  res.json({ msg: "Registered" });
});

app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).json({ msg: "User not found" });

  const isMatch = await bcrypt.compare(req.body.password, user.password);
  if (!isMatch) return res.status(400).json({ msg: "Wrong password" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ token });
});

app.post("/badge", auth, async (req, res) => {
  await Badge.create({ ...req.body, userId: req.userId });
  res.json({ msg: "Badge added" });
});

app.get("/badge", auth, async (req, res) => {
  const badges = await Badge.find({ userId: req.userId });
  res.json(badges);
});

app.delete("/badge/:id", auth, async (req, res) => {
  await Badge.findByIdAndDelete(req.params.id);
  res.json({ msg: "Deleted" });
});

app.listen(5000, () => console.log("Server running on 5000"));
