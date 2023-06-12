const express = require('express');
const router = express.Router();
const User = require('../../schemas/user_schema');
const {generateToken} = require("../../user_verification/jwt_authentication");

router.post('/', async (req, res, next) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false,message: 'Invalid username or password' });
    }
    user.comparePassword(password, (err, isMatch) => {
      if (err) {
        return next(err);
      }
      if (!isMatch) {
        return res.status(401).json({ success: false,message: 'Invalid username or password' });
      }

      
      const token = generateToken(user);
      const { firstname, lastname } = user;
      console.log({ success: true ,token, username, firstname, lastname })
      return res.json({ success: true ,token, username, firstname, lastname });
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
