const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const pdfParse = require("pdf-parse");
const { recognize } = require("tesseract.js");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const uploadsDir = path.join(__dirname, "uploads");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

const CERTIFICATE_POSITIVE_HINTS = [
  "certificate",
  "certification",
  "certified",
  "credential",
  "diploma",
  "award",
  "completion",
  "completed",
  "issued",
  "issuing authority",
  "authority",
  "seal",
  "signature",
  "verified",
  "academy",
  "institute",
  "university",
  "board",
  "training",
  "achievement"
];

const RANDOM_IMAGE_HINTS = [
  "selfie",
  "portrait",
  "photo",
  "random",
  "wallpaper",
  "screenshot",
  "meme",
  "landscape",
  "person",
  "face"
];

const normalizeText = (value = "") =>
  String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ");

const getReadablePdfText = (buffer) => {
  const text = buffer.toString("utf8");
  return text.replace(/[^\x09\x0A\x0D\x20-\x7E]+/g, " ");
};

const countHints = (text, hints) => {
  const normalized = normalizeText(text);
  return hints.reduce((count, hint) => (normalized.includes(hint) ? count + 1 : count), 0);
};

const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

const buildVerificationContext = (req, file) => {
  const fileName = file?.originalname || "";
  const fields = [req.body.title, req.body.skill, req.body.organization, fileName].filter(Boolean).join(" ");
  return {
    fileName,
    fields,
    normalizedFields: normalizeText(fields)
  };
};

const extractPdfContext = async (file) => {
  if (file.mimetype !== "application/pdf") {
    return { text: "", metadata: {} };
  }

  try {
    const parsed = await pdfParse(file.buffer);
    return {
      text: [parsed.text, parsed.info?.Title, parsed.info?.Author, parsed.info?.Subject]
        .filter(Boolean)
        .join(" "),
      metadata: parsed.info || {}
    };
  } catch (err) {
    console.warn("PDF parse warning:", err.message);
    return { text: "", metadata: {} };
  }
};

const extractImageContext = async (file) => {
  if (!file.mimetype.startsWith("image/")) {
    return { text: "", metadata: {} };
  }

  try {
    const result = await recognize(file.buffer, "eng");
    return {
      text: result?.data?.text || "",
      metadata: {
        confidence: Number(result?.data?.confidence ?? 0)
      }
    };
  } catch (err) {
    console.warn("OCR warning:", err.message);
    return { text: "", metadata: {} };
  }
};

const buildRuleBasedResult = ({ combinedText, fields, normalizedFields, file, duplicateFound, pdfMetadata, ocrText = "", ocrConfidence = 0 }) => {
  const positiveScore = countHints(combinedText, CERTIFICATE_POSITIVE_HINTS);
  const negativeScore = countHints(combinedText, RANDOM_IMAGE_HINTS);
  const imagePositiveScore = countHints(ocrText, CERTIFICATE_POSITIVE_HINTS);
  const imageNegativeScore = countHints(ocrText, RANDOM_IMAGE_HINTS);
  const hasIssuer = Boolean(fields.organization || fields.title);
  const hasPdfMetadata = Boolean(pdfMetadata?.Title || pdfMetadata?.Author || pdfMetadata?.Subject);
  const looksScanned = /scan|copy|screenshot|image|photo/i.test(combinedText);
  const hasImageEvidence = ocrText.trim().length > 40 && imagePositiveScore >= 2 && imageNegativeScore <= 1;

  if (negativeScore > positiveScore) {
    return {
      status: "rejected",
      originality: "unclear",
      score: 0.18,
      reason: "The upload looks more like a normal photo than a certificate."
    };
  }

  if (duplicateFound) {
    return {
      status: "rejected",
      originality: "duplicate",
      score: 0.12,
      reason: "An identical file was already uploaded, so this does not look original."
    };
  }

  if (file.mimetype === "application/pdf" && positiveScore < 2 && !hasPdfMetadata) {
    return {
      status: "rejected",
      originality: "unclear",
      score: 0.3,
      reason: "The PDF does not expose enough certificate details to verify."
    };
  }

  if (file.mimetype.startsWith("image/")) {
    if (!hasImageEvidence) {
      return {
        status: "rejected",
        originality: "unclear",
        score: 0.22,
        reason: "The image does not contain enough certificate text to verify."
      };
    }

    return {
      status: "verified",
      originality: ocrConfidence >= 65 ? "original" : "unclear",
      score: Math.min(0.97, 0.6 + imagePositiveScore * 0.08 + (ocrConfidence / 100) * 0.15),
      reason: "The image contains certificate text and passed the local verification checks."
    };
  }

  if (!fields && !combinedText) {
    return {
      status: "rejected",
      originality: "unclear",
      score: 0.22,
      reason: "The upload is missing certificate details."
    };
  }

  return {
    status: "verified",
    originality: looksScanned ? "unclear" : "original",
    score: Math.min(0.98, 0.52 + positiveScore * 0.12 + (hasIssuer ? 0.08 : 0) + (hasPdfMetadata ? 0.05 : 0)),
    reason: looksScanned
      ? "The file looks like a certificate, but its originality cannot be fully proven from the upload alone."
      : "The file looks like a certificate and passed the originality checks available from the upload."
  };
};

const runAiVerification = async (req, file) => {
  const verificationContext = buildVerificationContext(req, file);
  const { fields, normalizedFields } = verificationContext;
  const pdfContext = await extractPdfContext(file);
  const imageContext = await extractImageContext(file);
  const combinedText = `${fields} ${pdfContext.text} ${imageContext.text}`.trim();
  const contentHash = sha256(file.buffer);
  const duplicateFound = await Badge.findOne({ contentHash });

  if (duplicateFound) {
    return {
      status: "rejected",
      originality: "duplicate",
      score: 0.12,
      reason: "An identical file was already uploaded, so this does not look original."
    };
  }

  if (!OPENAI_API_KEY) {
    return buildRuleBasedResult({
      combinedText,
      fields: verificationContext,
      normalizedFields,
      file,
      duplicateFound,
      pdfMetadata: {
        ...pdfContext.metadata,
        ...imageContext.metadata
      },
      ocrText: imageContext.text,
      ocrConfidence: imageContext.metadata?.confidence || 0
    });
  }

  const prompt = [
    "You are verifying whether an uploaded document is a real certificate or diploma, not a random photo or unrelated file.",
    "Also judge whether the upload looks original/authentic versus duplicated, copied, or obviously edited.",
    "You cannot prove absolute originality, so use 'unclear' when authenticity cannot be established confidently.",
    "Return only JSON with keys: status, originality, score, reason.",
    'status must be "verified" or "rejected".',
    'originality must be "original", "duplicate", or "unclear".',
    "score must be a number from 0 to 1.",
    "reason must be one short sentence."
  ].join(" ");

  let aiContent = null;

  if (file.mimetype.startsWith("image/")) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`AI verification failed with status ${response.status}`);
    }

    const payload = await response.json();
    aiContent = payload?.choices?.[0]?.message?.content || "{}";
  } else {
    const textPrompt = [
      prompt,
      "Here is the extracted PDF text and metadata to inspect:",
      `Text: ${combinedText || "[no extracted text]"}`,
      `File name: ${file.originalname || ""}`,
      `PDF metadata title: ${pdfContext.metadata?.Title || ""}`,
      `PDF metadata author: ${pdfContext.metadata?.Author || ""}`,
      `PDF metadata subject: ${pdfContext.metadata?.Subject || ""}`,
      `OCR confidence: ${imageContext.metadata?.confidence || 0}`,
      duplicateFound ? "A duplicate file hash was found." : "No duplicate file hash was found."
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: textPrompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`AI verification failed with status ${response.status}`);
    }

    const payload = await response.json();
    aiContent = payload?.choices?.[0]?.message?.content || "{}";
  }

  let parsed = aiContent;

  if (typeof aiContent === "string") {
    try {
      parsed = JSON.parse(aiContent);
    } catch (parseErr) {
      parsed = { status: "rejected", originality: "unclear", score: 0, reason: "The AI response could not be read." };
    }
  }

  const normalizedStatus = parsed.status === "verified" ? "verified" : "rejected";
  const normalizedOriginality = ["original", "duplicate", "unclear"].includes(parsed.originality)
    ? parsed.originality
    : "unclear";

  if (normalizedOriginality === "duplicate") {
    return {
      status: "rejected",
      originality: "duplicate",
      score: Number(parsed.score ?? 0),
      reason: parsed.reason || "The upload looks duplicated, so it was rejected."
    };
  }

  return {
    status: normalizedStatus,
    originality: normalizedOriginality,
    score: Number(parsed.score ?? 0),
    reason: parsed.reason || "Verification completed."
  };
};

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
  fileName: String,
  verificationStatus: {
    type: String,
    default: "verified"
  },
  originality: {
    type: String,
    default: "unclear"
  },
  verificationScore: {
    type: Number,
    default: 1
  },
  verificationReason: String,
  contentHash: {
    type: String,
    index: true
  },
  verifiedAt: Date
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

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required." });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ email, password: hashed });
    res.json({ msg: "Registered" });
  } catch (err) {
    console.error("Register error:", err);
    if (err?.code === 11000) {
      return res.status(409).json({ msg: "That email is already registered." });
    }
    res.status(500).json({ msg: "Unable to register user" });
  }
});

app.post("/login", async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ msg: "Email and password are required." });
    }

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
    if (!req.file) {
      return res.status(400).json({ msg: "Please upload a certificate file." });
    }

    const verification = await runAiVerification(req, req.file);

    if (verification.status !== "verified") {
      return res.status(422).json({
        msg: verification.reason || "The upload was rejected by the certificate verifier.",
        verification
      });
    }

    const contentHash = sha256(req.file.buffer);

    const imageUrl = req.file
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
      : "";

    await Badge.create({
      ...req.body,
      userId: req.userId,
      imageUrl,
      fileType: req.file?.mimetype || "",
      fileName: req.file?.originalname || "",
      contentHash,
      verificationStatus: verification.status,
      originality: verification.originality,
      verificationScore: verification.score,
      verificationReason: verification.reason,
      verifiedAt: new Date()
    });

    res.json({ msg: "Badge added and verified", verification });
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
