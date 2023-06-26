const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const app = express();
const Stripe = require("stripe");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const upload = multer({ dest: "upload/" });
const bcrypt = require("bcrypt");

cloudinary.config({
  cloud_name: "dtmp7op6k",
  api_key: "989387644814239",
  api_secret: "IYVOamSGXPxz0C0iulGleE0axr4",
});

app.use(cors());
app.use(express.json({ limit: "1000mb" }));

const PORT = process.env.PORT || 8000;

// mongodb connection
// console.log(process.env.MONGODB_URL);
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to database !!");
  })
  .catch((err) => {
    console.log("Connection failed !!" + err.message);
  });

//   schemaaa

const userSchema = mongoose.Schema({
  firstname: String,
  lastname: String,
  email: {
    type: String,
    unique: true,
  },
  password: String,
  confirmpassword: String,
});

// model

const userModel = mongoose.model("user", userSchema);

// api

app.get("/", (req, res) => {
  res.send("Server is running");
});

// signup

async function signup(req, res) {
  const { email, password } = req.body;

  const result = await userModel.findOne({ email: email });
  if (result) {
    res.send({ message: "email id is already registered", alert: false });
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);

    const data = userModel({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      password: hashedPassword,
      confirmpassword: req.body.confirmpassword,
    });
    await data.save();
    res.send({ message: "Successfully Signup", alert: true });
  }
}

app.post("/signup", signup);

// Login

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email: email });

  if (user) {
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (isPasswordMatch) {
      const dataSend = {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
      };

      res.send({
        message: "Login is successful",
        alert: true,
        data: dataSend,
      });
    } else {
      res.send({
        message: "Incorrect password",
        alert: false,
      });
    }
  } else {
    res.send({
      message: "Email is not available, please sign up",
      alert: false,
    });
  }
});

// Product Section

const schemaProduct = mongoose.Schema({
  name: String,
  category: String,
  image: String,
  price: String,
  discount: String,
  rating: String,
  description: String,
});

const productModel = mongoose.model("product", schemaProduct);

app.post("/uploadProduct", upload.single("image"), async (req, res, next) => {
  try {
    const { name, category, discount, rating, price, description } = req.body;

    // Upload the image to Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.upload(req.file.path, {
      folder: "product-images", // Optional folder in Cloudinary
    });

    // Create a new product instance with the image URL
    const data = await productModel({
      name,
      category,
      price,
      description,
      discount,
      rating,
      image: cloudinaryResponse.secure_url, // Store the Cloudinary image URL
    });

    // Save the product in the database
    const dataSave = await data.save();

    res.send({
      message: "Upload Successful",
    });
  } catch (error) {
    res.status(500).json({
      message: "Upload Failed",
      error: error.message,
    });
  }
});

// get user info

// with pagination

// app.get("/product", async (req, res) => {
//   const { page = 1, limit = 8 } = req.query;
//   try {
//     const data = await productModel
//       .find({})
//       .skip((page - 1) * limit)
//       .limit(Number(limit));
//     res.send(JSON.stringify(data));
//   } catch (error) {
//     res.status(500).json({
//       message: "Failed to retrieve products",
//       error: error.message,
//     });
//   }
// });

// without pagination

 app.get("/product", async (req, res) => {
   const data = await productModel.find({});
  res.send(JSON.stringify(data));
 });

// Stripe Payment

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post("/checkout-payment", async (req, res) => {
  try {
    const params = {
      submit_type: "pay",
      mode: "payment",
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      shipping_options: [{ shipping_rate: "shr_1NKP6MSFNB5NKPFSVmgqyUu6" }],
      line_items: req.body.map((item) => {
        return {
          price_data: {
            currency: "inr",
            product_data: {
              name: item.name,
              // images : [item.image]
            },
            unit_amount: item.price * 100,
          },
          adjustable_quantity: {
            enabled: true,
            minimum: 1,
          },
          quantity: item.qty,
        };
      }),

      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    };

    const session = await stripe.checkout.sessions.create(params);
    res.status(200).json(session.id);
  } catch (error) {
    res.status(error.statusCode || 500).json(error.message);
  }

  // res.send({
  //   message: "Payment Gateway",
  //   success: true,
  // });
});

// get user info

// Add the following code after the "/checkout-payment" endpoint

// Retrieve all users

app.get("/users", async (req, res) => {
  try {
    const users = await userModel.find({});
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Api running

app.listen(PORT, () => console.log("Server is running port : " + PORT));
