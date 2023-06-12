const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { saltRounds } = require('../constants');

const accessSchema = new mongoose.Schema({
  entityId:{
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  level:{
    type: Number,
    required: true
  }
});

const userSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  username: {
    type: String,
    unique: true,
  },
  password: String,
  salt: String,
  isAdmin: {
    type: Boolean,
    default: false,
  },
  questionPaperId: {
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
    ref:"QuestionPaper"
  },
  answeredQuestionPaperId:{
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
    ref:"QuestionPaper"
  },
  adminAccessQuestionPaper: {
    type: [accessSchema],
    default: [],
  },
  groupId: {
    type: [mongoose.Schema.Types.ObjectId],
    default: []
  },
  adminAccessGroup: {
    type: [accessSchema],
    default: []
  },
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  bcrypt.genSalt(saltRounds, (err, salt) => {
    if (err) {
      return next(err);
    }
    console.log("salt printed")
    console.log(salt);
    console.log(this);
    bcrypt.hash(this.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }
      this.password = hash;
      this.salt = salt;
      next();
    });
  });
});

userSchema.methods.comparePassword = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    if (err) {
      return cb(err);
    }
    cb(null, isMatch);
  });
};

module.exports = mongoose.model('User', userSchema);
