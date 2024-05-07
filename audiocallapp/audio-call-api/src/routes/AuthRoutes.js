const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/UserModel');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    const { name, mobileNumber, password } = req.body;
  console.log("req.body",req.body)
    try {
      // Check if the user already exists
      let user = await User.findOne({ mobileNumber });
      if (user) {
        return res.status(400).send('User already exists');
      }
  
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create a new user
      user = new User({
        name,
        mobileNumber,
        password: hashedPassword
      });
  
      // Save the user to the database
      await user.save();
  
      // Create a token
      const token = jwt.sign({ _id: user._id }, 'secretkey', { expiresIn: '1h' });
  
      // Send token to the user
      res.header('auth-token', token).send({ token });
    } catch (err) {
      res.status(500).send('Server Error');
    }
  });

// Login
router.post('/login', async (req, res) => {
    const { mobileNumber, password } = req.body;
    try {
      let user = await User.findOne({ mobileNumber });
      if (!user) return res.status(400).send('User does not exist');
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).send('Invalid credentials');
  
      const token = jwt.sign({ _id: user._id }, 'secretkey');
  
      // Create a user object without the password for the response
      const userResponse = {
        _id: user._id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        // Add any other fields you want to return
      };
  
      res.header('auth-token', token).send({ token, user: userResponse });
    } catch (err) {
      res.status(500).send('Server Error');
    }
  });

module.exports = router;
