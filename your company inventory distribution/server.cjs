const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 5000;

const JWT_SECRET = "yc_enterprise_secret_key_2025";

const MONGODB_URI =
"mongodb+srv://priyadharshan0206_db_user:priyan%402302@cluster0.c1esyd9.mongodb.net/YourCompany?retryWrites=true&w=majority&appName=cluster0";
app.use(cors());
app.use(express.json());


// =======================
// MONGODB CONNECTION
// =======================

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log("Connected to MongoDB Atlas");
})
.catch((err) => {
  console.error("MongoDB Connection Error:", err.message);
});


// =======================
// SCHEMAS
// =======================

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: String,
  userId: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, enum: ["Admin", "Manager", "Worker"] },
  createdAt: { type: Date, default: Date.now }
});

const ProductSchema = new mongoose.Schema({
  companyId: mongoose.Schema.Types.ObjectId,
  productName: String,
  category: String,
  totalStock: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

const WorkerSchema = new mongoose.Schema({
  companyId: mongoose.Schema.Types.ObjectId,
  name: String,
  gender: String,
  mobile: String
});

const DistributionSchema = new mongoose.Schema({
  companyId: mongoose.Schema.Types.ObjectId,
  workerId: mongoose.Schema.Types.ObjectId,
  workerName: String,
  productId: mongoose.Schema.Types.ObjectId,
  productName: String,
  quantity: Number,
  distributedBy: String,
  distributedAt: { type: Date, default: Date.now }
});


// =======================
// MODELS
// =======================

const Company = mongoose.model("Company", CompanySchema);
const User = mongoose.model("User", UserSchema);
const Product = mongoose.model("Product", ProductSchema);
const Worker = mongoose.model("Worker", WorkerSchema);
const Distribution = mongoose.model("Distribution", DistributionSchema);


// =======================
// AUTH MIDDLEWARE
// =======================

const authenticate = (req, res, next) => {

  const header = req.headers.authorization;

  if (!header)
    return res.status(401).json({ error: "No token provided" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  }
  catch {
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
// COMPANY ROUTES
// =======================

app.post("/api/company/setup", async (req, res) => {

  try {

    const { name } = req.body;

    const company = new Company({ name });

    await company.save();

    res.json(company);

  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }

});


app.get("/api/company", async (req, res) => {

  try {

    const company = await Company.findOne().sort({ createdAt: -1 });

    res.json(company);

  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }

});


// =======================
// AUTH ROUTES
// =======================

app.post("/api/auth/register", async (req, res) => {

  try {

    const { companyId, name, userId, password, role } = req.body;

    const hash = await bcrypt.hash(password, 10);

    const user = new User({
      companyId,
      name,
      userId,
      passwordHash: hash,
      role
    });

    await user.save();

    res.json({ message: "User registered successfully" });

  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }

});


app.post("/api/auth/login", async (req, res) => {

  try {

    const { userId, password } = req.body;

    const user = await User.findOne({ userId });

    if (!user)
      return res.status(401).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid)
      return res.status(401).json({ error: "Wrong password" });

    const token = jwt.sign(
      {
        id: user._id,
        companyId: user.companyId,
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      token,
      user: {
        name: user.name,
        role: user.role,
        companyId: user.companyId
      }
    });

  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }

});


// =======================
// START SERVER
// =======================

app.listen(PORT, () => {

  console.log("Backend running on http://localhost:" + PORT);

});