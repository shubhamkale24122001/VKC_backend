const express = require('express');
const router = express.Router();
const QuestionPaper = require('../../schemas/question_paper_schema');
const AnswerSheet = require('../../schemas/answer_sheet_schema');
const Group = require("../../schemas/group_schema")
const User = require('../../schemas/user_schema');
const {authenticateToken, notifyPermissionsChanged} = require('../../user_verification/jwt_authentication');
const {validateAdmin, validateQuestionAccess, validateQuestionAdminAccess, validateQuestionCreator} = require('../../utility/user_access_check');
const mongoose = require('mongoose');

async function deleteAnswers(questionPaper){
  const {_id} = questionPaper;
  const res = await AnswerSheet.deleteMany({questionPaperId: new mongoose.Types.ObjectId(_id)});
  console.log(res);
}
async function deleteUserQuestionsAndGroupQuestions(questionPaper){
    const {_id, validUsers, groupId} = questionPaper;
    console.log(_id);
    console.log(validUsers);
    const res = await User.updateMany({username: {$in: validUsers}},
                {$pull:{questionPaperId: new mongoose.Types.ObjectId(_id), adminAccessQuestionPaper:{entityId: new mongoose.Types.ObjectId(_id)}}},
                {multi: true});
    console.log(res);

    const res1 = await Group.updateMany({_id:{$in: groupId.map((ids)=>new mongoose.Types.ObjectId(ids))}}, {$pull:{questionPaperId: new mongoose.Types.ObjectId(_id)}});    
}

router.get('/userQuestions', authenticateToken,async (req,res)=>{
  try{
    const questions = await QuestionPaper.find({_id:{$in: req.user.questionPaperId.map((ids)=>new mongoose.Types.ObjectId(ids))}})
    res.status(200).json({questions, token: req.user_token_, success: true});
  }catch(err){
    console.error(err);
    res.status(500).json({message:'Internal Server Error', success: false});
  }
});

router.get('/userAdminQuestions', authenticateToken,async (req,res)=>{
  try{
    const questions = await QuestionPaper.find({_id:{$in: req.user.adminAccessQuestionPaper.map((obj)=>new mongoose.Types.ObjectId(obj.entityId))}});
    res.status(200).json({questions, token: req.user_token_, success: true});
  }catch(err){
    console.error(err);
    res.status(500).json({message:'Internal Server Error', success: false});
  }
});

// Create a new question paper
router.post('/', authenticateToken, validateAdmin, async (req, res) => {
  try {
    let { name, type, questions, multipleAttempts, editAnswer } = req.body;

    // Create a new question paper document
    const questionPaper = new QuestionPaper({
      name,
      type,
      questions,
      creator: req.user.username,
      multipleAttempts,
      editAnswer
    });

    questionPaper.validUsers.push(req.user.username);
    questionPaper.adminAccessUsers.push(req.user.username);
    // Save the question paper document to the database
    const savedQuestionPaper = await questionPaper.save();

    // Add the new question paper's id to the user's questionPaperId list
    const username = req.user.username;
    const user = await User.findOne({username: username});
    console.log(user);
    user.questionPaperId.push(savedQuestionPaper._id);
    user.adminAccessQuestionPaper.push({entityId: savedQuestionPaper._id, level: 0});
    const val = await user.save();
    console.log(val);
    
    await notifyPermissionsChanged([req.user.username],req.user);
    res.status(201).json({message:"questionPaper successfully created",success: true, token: req.user._token_});
  } catch (err) {
    console.error(err);
    res.status(500).json({message:'Internal Server Error', success: false});
  }
});

router.get('/:questionPaperId', authenticateToken, validateQuestionAccess, async (req, res) => {
    try {
      // retrieve question paper by ID
      const questionPaper = await QuestionPaper.findById(req.params.questionPaperId);
  
      // check if question paper exists
      if (!questionPaper) {
        return res.status(404).json({ message: 'Question paper not found' });
      }
  
      // return question paper
      return res.json({question:questionPaper, success: true, token: req.user._token_});
    } catch (error) {
      return res.status(500).json({ message: 'Server error' , success: false});
    }
});

router.put('/modify/:questionPaperId', authenticateToken, validateQuestionAdminAccess, async (req, res) => {
    try {
      const { questionPaperId } = req.params;
      const { name, type, questions, requestResubmit} = req.body;
  
      const questionPaper = await QuestionPaper.findById(questionPaperId);
      if (!questionPaper) {
        return res.status(404).json({ message: 'Question paper not found' , success:false});
      }
  
      questionPaper.name = name || questionPaper.name;
      questionPaper.type = type || questionPaper.type;
      questionPaper.questions = questions || questionPaper.questions;
  
      const updatedQuestionPaper = await questionPaper.save();
      console.log(updatedQuestionPaper);
      if(requestResubmit){
        deleteAnswers(updatedQuestionPaper);
      }

      res.json({question:updatedQuestionPaper, success: true, token: req.user._token_});
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal Server Error', success: false });
    }
  });

  router.delete('/delete/:questionPaperId', authenticateToken, validateQuestionCreator,async (req, res) => {
    try {
        const questionPaper = await QuestionPaper.findById(req.params.questionPaperId);
        console.log(questionPaper);
    
        if (!questionPaper) {
            return res.status(404).json({
            error: `Question Paper with id ${req.params.questionPaperId} not found.`,
            success: false
            });
        }

        await deleteUserQuestionsAndGroupQuestions(questionPaper);
        await deleteAnswers(questionPaper);
        const {validUsers} = questionPaper;
        await notifyPermissionsChanged(validUsers, req.user);
        const deletedQuestionPaper = await QuestionPaper.findByIdAndDelete(req.params.questionPaperId);
    
        return res.status(200).json({
            message: `Question Paper with id ${req.params.questionPaperId} deleted successfully.`,
            success: true,
            token: req.user._token_
        });
    
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: 'Internal Server Error.',
        success: false
      });
    }
  });
  

module.exports = router;
