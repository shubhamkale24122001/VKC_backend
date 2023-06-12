const mongoose = require('mongoose');

const answerSheetSchema = new mongoose.Schema({
  questionPaperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionPaper',
    required: true
  },
  groupId:{
    type: mongoose.Schema.Types.ObjectId
  },
  username: {
    type: String,
    required: true
  },
  answers: {
    type:[[String]],
    default:[]
  },
  score: Number
});

const AnswerSheet = mongoose.model('AnswerSheet', answerSheetSchema);

module.exports = AnswerSheet;
