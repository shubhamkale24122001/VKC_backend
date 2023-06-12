const mongoose = require('mongoose');
const { Schema } = mongoose;

const expireTokenSchema = new Schema({
  creationTime: {
    type: Date,
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

module.exports = mongoose.model('PermissionsChanged', expireTokenSchema);
