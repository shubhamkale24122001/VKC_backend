const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    country: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      district: {
        type: String,
      },
      taluk: {// taluk or tehsil
        type: String,
      },
      ward:{
        type: String
      },
      place: {
        type: String,
        required: true
      }
});

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    questionPaperId: {
        type: [mongoose.Schema.Types.ObjectId],
        default:[]
    },
    location: {
      type: locationSchema,
      required: true
    },
    creator: {
        type: String,
        required: true
    },
    validUsers:{
        type:  [String],
        default :[]
    },
    adminAccessUsers:{
        type: [String],
        default:[]
    },
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
