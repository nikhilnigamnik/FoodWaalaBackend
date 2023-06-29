const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const router = express.Router();

const upload = multer({ dest: "upload/" });
const productModel = require("../models/product");

cloudinary.config({
  cloud_name: "dtmp7op6k",
  api_key: "989387644814239",
  api_secret: "IYVOamSGXPxz0C0iulGleE0axr4",
});

router.post("/uploadProduct", upload.single("image"), async (req, res) => {
  try {
    const { name, category, discount, rating, price, description } = req.body;

    const cloudinaryResponse = await cloudinary.uploader.upload(req.file.path, {
      folder: "product-images",
    });

    const data = await productModel({
      name,
      category,
      price,
      description,
      discount,
      rating,
      image: cloudinaryResponse.secure_url,
    });

    const dataSave = await data.save();

    res.send({
      message: "Upload successful",
    });
  } catch (error) {
    res.status(500).json({
      message: "Upload failed",
      error: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  const data = await productModel.find({});
  res.send(JSON.stringify(data));
});

module.exports = router;
