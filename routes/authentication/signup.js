const express = require('express');
const router = express.Router();
const User = require('../../schemas/user_schema');


router.post('/', async (req, res, next) => {
    // console.log("signup run");
    // console.log(req.body);
    const { firstname, lastname, username, password, isAdmin } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

    const user = new User({
        firstname,
        lastname,
        username,
        password,
        isAdmin,
    });
    await user.save();
    return res.status(201).json({ success: true, message: 'User created successfully' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
