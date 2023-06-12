const express = require('express');
const router = express.Router();
const User = require('../../schemas/user_schema');
const {authenticateToken, expireUserToken} = require("../../user_verification/jwt_authentication");

router.get('/', authenticateToken, async (req, res) => {
  try {
    await expireUserToken(req.user);
    res.statusCode(200).json({message:"User logged out", success: true});

  } catch (err) {
    return next(err);
  }
});

module.exports = router;
