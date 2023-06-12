const mongoose = require('mongoose');
const { Schema } = mongoose;

const expireTokenSchema = new Schema({
  token: {
    type: String,
    required: true,
  },
  expirationTime: {
    type: Date,
    required: true
  },
  username:{
    type: String,
    required: true
  }
});

module.exports = mongoose.model('ExpireToken', expireTokenSchema);
