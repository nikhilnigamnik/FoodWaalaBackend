const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

const userModel = require("../models/user");

// Signup
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await userModel.findOne({ email: email });
    if (result) {
      res.send({ message: "Email ID is already registered", alert: false });
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
      res.send({ message: "Successfully signed up", alert: true });
    }
  } catch (err) {
    res.status(500).send({ message: "Signup failed", alert: false });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
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
  } catch (err) {
    res.status(500).send({ message: "Login failed", alert: false });
  }
});

module.exports = router;
