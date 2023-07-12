const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const app = express();
const Stripe = require("stripe");

app.use(cors());
app.use(express.json({ limit: "100mb" }));

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
  const { email } = req.body;

  const result = await userModel.findOne({ email: email });
  if (result) {
    res.send({ message: "email id is already registered", alert: false });
  } else {
    const data = userModel(req.body);
    await data.save();
    res.send({ message: "Successfully Signup", alert: true });
  }
}

app.post("/signup", signup);

// Login

app.post("/login", async (req, res) => {
  // console.log(req.body);
  const { email } = req.body;

  // Use the `findOne()` method to find the user with the specified email address.
  const result = await userModel.findOne({ email: email });

  // If the user is found, send a success message.
  if (result) {
    const dataSend = {
      _id: result._id,
      firstName: result.firstName,
      lastName: result.lastName,
      email: result.email,
    };
    // console.log(dataSend);
    res.send({
      message: "Login is successfully",
      alert: true,
      data: dataSend,
    });
  } else {
    // If the user is not found, send a failure message.
    res.send({
      message: "Email is not available, please sign up",
      alert: false,
    });
  }
});

// purchase section 

// User Account Section

const accountSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    unique: true,
  },
  purchases: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
      },
      quantity: Number,
    },
  ],
});

const accountModel = mongoose.model("account", accountSchema);



// Retrieve Order History
app.get("/orderHistory", async (req, res) => {
  const { userId } = req.body;

  try {
    const userAccount = await accountModel.findOne({ userId: userId }).populate("purchases.productId");

    if (userAccount) {
      const orderHistory = userAccount.purchases.map((purchase) => ({
        _id: purchase._id,
        product: purchase.productId,
        quantity: purchase.quantity,
      }));

      res.send(orderHistory);
    } else {
      res.send([]);
    }
  } catch (error) {
    console.error("Error retrieving order history:", error);
    res.status(500).json({ error: "Error retrieving order history" });
  }
});


// Purchase Product

app.post("/purchase", async (req, res) => {
  const { userId, productId, quantity } = req.body;

  try {
    const userAccount = await accountModel.findOne({ userId: userId });

    if (userAccount) {
      // User account exists, add purchase to existing account
      userAccount.purchases.push({
        productId: productId,
        quantity: quantity,
      });
      await userAccount.save();
    } else {
      // User account does not exist, create a new account and add purchase
      const newAccount = new accountModel({
        userId: userId,
        purchases: [
          {
            productId: productId,
            quantity: quantity,
          },
        ],
      });
      await newAccount.save();
    }

    res.send({
      message: "Product purchased successfully and added to the account.",
      success: true,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json(error.message);
  }
});


// Product Section

const schemaProduct = mongoose.Schema({
  name: String,
  category: String,
  image: String,
  price: String,
  description: String,
});

const productModel = mongoose.model("product", schemaProduct);

// save product in DB

app.post("/uploadProduct", async (req, res) => {
  const data = await productModel(req.body);
  const dataSave = await data.save();
  res.send({
    message: "upload Seccessfully",
  });
});

// get product data

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

// Api running

app.listen(PORT, () => console.log("Server is running port : " + PORT));