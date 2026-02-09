const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// =======================
// MONGODB CONNECTION
// =======================

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
    console.log("📂 DB Name:", mongoose.connection.name);
  })
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
  });

// =======================
// SCHEMAS
// =======================

const Company = mongoose.model("Company", new mongoose.Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}));

const User = mongoose.model("User", new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: String,
  userId: { type: String }, // Removed unique: true global constraint
  passwordHash: String,
  role: { type: String, enum: ["Admin", "Manager", "Worker"] },
  createdAt: { type: Date, default: Date.now }
}));

// Compound index to ensure userId is unique PER company
User.schema.index({ companyId: 1, userId: 1 }, { unique: true });

const Product = mongoose.model("Product", new mongoose.Schema({
  companyId: mongoose.Schema.Types.ObjectId,
  productName: String,
  category: String,
  totalStock: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
}));

const Worker = mongoose.model("Worker", new mongoose.Schema({
  companyId: mongoose.Schema.Types.ObjectId,
  name: String,
  gender: String,
  mobile: String
}));

const Distribution = mongoose.model("Distribution", new mongoose.Schema({
  companyId: mongoose.Schema.Types.ObjectId,
  workerId: mongoose.Schema.Types.ObjectId,
  workerName: String,
  productId: mongoose.Schema.Types.ObjectId,
  productName: String,
  quantity: Number,
  pricePerUnit: Number, // New Field
  totalAmount: Number,  // New Field
  distributedBy: String,
  distributedAt: { type: Date, default: Date.now }
}));

// =======================
// AUTH MIDDLEWARE
// =======================

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token provided" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// =======================
// TEST ROUTE
// =======================

app.get("/", (req, res) => {
  res.send("Backend running successfully");
});

// =======================
// COMPANY
// =======================

app.post("/api/company/setup", async (req, res) => {
  try {
    const existing = await Company.findOne({ name: req.body.name });
    if (existing) return res.status(400).json({ error: "Company name already taken" });

    const company = await Company.create({ name: req.body.name });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/company/check", async (req, res) => {
  try {
    const company = await Company.findOne({ name: req.body.name });
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/company", async (req, res) => {
  // This is a bit ambiguous without auth, but for setup purposes locally it's ok. 
  // Ideally should be authenticated or return null.
  const company = await Company.findOne().sort({ createdAt: -1 });
  res.json(company);
});

// =======================
// AUTH
// =======================

app.post("/api/auth/register", async (req, res) => {
  try {
    const { companyId, name, userId, password, role } = req.body;

    const existingUser = await User.findOne({ companyId, userId });
    if (existingUser) return res.status(400).json({ error: "User ID already exists in this company" });

    const hash = await bcrypt.hash(password, 10);

    await User.create({
      companyId,
      name,
      userId,
      passwordHash: hash,
      role
    });

    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { companyName, userId, password } = req.body;

    // 1. Find Company
    const company = await Company.findOne({ name: companyName });
    if (!company) return res.status(404).json({ error: "Company not found" });

    // 2. Find User in that Company
    const user = await User.findOne({ companyId: company._id, userId });
    if (!user) return res.status(401).json({ error: "User not found in this company" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Wrong password" });

    const token = jwt.sign(
      {
        id: user._id,
        companyId: user.companyId,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({ token, user, company });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// PRODUCTS
// =======================

app.post("/api/products", authenticate, async (req, res) => {
  try {
    const product = await Product.create({
      companyId: req.user.companyId,
      productName: req.body.productName,
      category: req.body.category,
      totalStock: req.body.totalStock || 0
    });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/products", authenticate, async (req, res) => {
  const products = await Product.find({ companyId: req.user.companyId });
  res.json(products);
});

// =======================
// WORKERS
// =======================

app.post("/api/workers", authenticate, async (req, res) => {
  try {
    const worker = await Worker.create({
      companyId: req.user.companyId,
      name: req.body.name,
      gender: req.body.gender,
      mobile: req.body.mobile
    });

    res.json(worker);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/workers", authenticate, async (req, res) => {
  const workers = await Worker.find({ companyId: req.user.companyId });
  res.json(workers);
});

// =======================
// DISTRIBUTIONS
// =======================

app.post("/api/distributions", authenticate, async (req, res) => {
  try {
    const { workerId, productId, quantity, pricePerUnit } = req.body;

    // 1. Get Product
    const product = await Product.findOne({ _id: productId, companyId: req.user.companyId });
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (product.totalStock < quantity) return res.status(400).json({ error: `Insufficient stock for ${product.productName}` });

    // 2. Update Stock
    product.totalStock -= quantity;
    await product.save();

    // 3. Get Worker Details
    const worker = await Worker.findById(workerId);
    if (!worker) return res.status(404).json({ error: "Worker not found" });

    // 4. Calculate Amount
    const totalAmount = quantity * (pricePerUnit || 0);

    // 5. Create Distribution Record
    const distribution = await Distribution.create({
      companyId: req.user.companyId,
      workerId,
      workerName: worker.name,
      productId,
      productName: product.productName,
      quantity,
      pricePerUnit: pricePerUnit || 0,
      totalAmount,
      distributedBy: req.user.name,
      distributedAt: new Date()
    });

    res.json(distribution);
  } catch (err) {
    console.error("Distribution Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/distributions", authenticate, async (req, res) => {
  try {
    const distributions = await Distribution.find({ companyId: req.user.companyId }).sort({ distributedAt: -1 });
    res.json(distributions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// START SERVER
// =======================

app.listen(PORT, () => {
  console.log("🚀 Backend running on http://localhost:" + PORT);
});
