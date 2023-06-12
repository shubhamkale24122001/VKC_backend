const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionSchema = new Schema({
    type: {
      type: String,
      enum: ['paragraph', 'multiple_choice_single_correct', 'multiple_choice_multiple_correct'],
      required: true
    },
    question:{
      type: String,
      required: true
    },
    possibleAnswers: {
      type: [String],
      default: []
    },
    correctAnswers: {
      type: [String],
      default: []
    }
  });
  
  const questionPaperSchema = new Schema({
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['questionnaire', 'quiz'],
      required: true
    },
    questions: {
      type: [questionSchema],
      default: []
    },
    validUsers:{
        type:  [String],
        default :[]
    },
    groupId: {
        type: [mongoose.Schema.Types.ObjectId],
        default:[]
    },
    adminAccessUsers:{
        type: [String],
        default:[]
    },
    creator:{
        type: String,
        required: true
    },
    multipleAttempts:{
      type: Boolean,
      default: false
    },
    editAnswer:{
      type: Boolean,
      default: false
    }
  });
  
  const QuestionPaper = mongoose.model('QuestionPaper', questionPaperSchema);
  
  module.exports = QuestionPaper;
  