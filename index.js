const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const app = express();
const cloudinary = require("cloudinary").v2;

const PORT = process.env.PORT || 8000;

// MongoDB connection
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to database!!");
  })
  .catch((err) => {
    console.log("Connection failed!!" + err.message);
  });

app.use(cors());
app.use(express.json({ limit: "1000mb" }));

app.get("/", (req, res) => {
  res.send("Server is running");
});

// Load routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/product");
const paymentRoutes = require("./routes/payment");

// Routes
app.use("/auth", authRoutes);
app.use("/product", productRoutes);
app.use("/payment", paymentRoutes);

app.listen(PORT, () => console.log("Server is running on port: " + PORT));
