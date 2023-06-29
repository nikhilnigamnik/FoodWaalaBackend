const mongoose = require("mongoose");

const schemaProduct = mongoose.Schema({
  name: String,
  category: String,
  image: String,
  price: String,
  discount: String,
  rating: String,
  description: String,
});

module.exports = mongoose.model("product", schemaProduct);
