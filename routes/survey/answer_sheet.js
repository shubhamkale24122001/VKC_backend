const express = require('express');
const router = express.Router();
const QuestionPaper = require('../../schemas/question_paper_schema');
const AnswerSheet = require('../../schemas/answer_sheet_schema');
const User = require("../../schemas/user_schema");
const mongoose = require("mongoose");
const {authenticateToken, notifyPermissionsChanged} = require('../../user_verification/jwt_authentication');
const {validateQuestionAccess, validateQuestionAdminAccess, validateGroupAdminAccess} = require('../../utility/user_access_check');


router.get('/:questionPaperId/:answerId', authenticateToken, validateQuestionAccess, async (req, res) => {
    try {
      const questionPaperId = req.params.questionPaperId;
  
      // Retrieve question paper by ID
      const questionPaper = await QuestionPaper.findById(questionPaperId);
  
      // Retrieve answer sheet by questionPaperId
      const answerSheet = await AnswerSheet.findById(req.params.answerId);

      if(answerSheet.username !== req.user.username){
        return res.status(403).json({ message: 'Forbidden' , success: false});
      }
  
      res.status(200).json({ 
          question: questionPaper, 
          answers: answerSheet,
          success: true,
          token: req.user._token_
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', success: false });
    }
  });
  

// GET route to retrieve question paper and answer sheet based on questionPaperId
router.get('/:questionPaperId', authenticateToken, validateQuestionAdminAccess, async (req, res) => {
  try {
    const questionPaperId = req.params.questionPaperId;

    // Retrieve question paper by ID
    const questionPaper = await QuestionPaper.findById(questionPaperId);

    // Retrieve answer sheet by questionPaperId
    const answerSheet = await AnswerSheet.findMany({ questionPaperId });

    res.status(200).json({ 
        question: questionPaper, 
        answers: answerSheet,
        token: req.user._token_,
        success: true
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', success: false });
  }
});

router.get('/:groupId/:questionPaperId', authenticateToken, validateGroupAdminAccess, validateQuestionAccess, async (req, res) => {
    try {
      const questionPaperId = req.params.questionPaperId;
  
      // Retrieve question paper by ID
      const questionPaper = await QuestionPaper.findById(questionPaperId);
  
      // Retrieve answer sheet by questionPaperId
      const answerSheet = await AnswerSheet.findMany({ questionPaperId, groupId });
  
      res.status(200).json({ 
          question: questionPaper, 
          answers: answerSheet,
          token: req.user._token_,
          success: true
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' , success: false});
    }
  });

router.post('/:questionPaperId/submitAnswers', authenticateToken, validateQuestionAccess, async (req, res) => {
    const questionPaperId = req.params.questionPaperId;
  
    try {
      // Find the question paper by ID
      const questionPaper = await QuestionPaper.findById(questionPaperId);
  
      if (!questionPaper) {
        // Return a 404 error if the question paper doesn't exist
        return res.status(404).json({ error: 'Question paper not found', success: false });
      }

      if(req.user.answeredQuestionPaperId.includes(questionPaperId) && !questionPaper.multipleAttempts) return res.status(403).json({ message: 'Multiple attempts not allowed' , success: false});
  
      const answerSheet = new AnswerSheet({
        questionPaperId: req.body.questionPaperId,
        answers: req.body.answers,
        username: req.user.username
      });
      if(req.body.groupId){
        answerSheet.groupId = req.body.groupId;
      }
      await answerSheet.save()
      
      await User.updateMany({username: req.user.username},{$push:{answeredQuestionPaperId: new mongoose.Types.ObjectId(questionPaperId)}});
      await notifyPermissionsChanged([req.user.username], req.user);
      // Return the updated question paper
      res.json({message: "Answer Saved Successfully", success: true, token: req.user._token_});
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error', success: false });
    }
  });


// PUT route to update an answer based on question ID and answer ID
router.put('/:questionId/modify/:answerId', authenticateToken, validateQuestionAccess,async (req, res) => {
  const questionId = req.params.questionId;
  const answerId = req.params.answerId;
  const { answers } = req.body;

  try {
    // Find the answer by ID and question ID
    const existingAnswer = await AnswerSheet.findById(answerId);

    if (!existingAnswer) {
      // Return a 404 error if the answer doesn't exist
      return res.status(404).json({ error: 'Answer not found' , success: false});
    }

    if(existingAnswer.username !== req.user.username){
        return res.status(401).json({error:"You are not authorized to edit this answer", success: false});
    }

    if(existingAnswer.questionPaperId !== questionId){
        return res.status(401).json({error:"You are not authorized to edit this answer", success: false});
    }
    // Update the answer
    existingAnswer.answers = answers;
    await existingAnswer.save();

    // Return the updated answer
    res.json({answer: existingAnswer, token: req.user._token_});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' , success: false});
  }
});


  router.delete('/:questionId/delete/:answerId', authenticateToken, validateQuestionAdminAccess, async (req, res) => {
    const questionId = req.params.questionId;
    const answerId = req.params.answerId;
  
    try {
      // Find the answer by ID and question ID
      const answer = await AnswerSheet.findById(answerId);
  
      if (!answer) {
        // Return a 404 error if the answer doesn't exist
        return res.status(404).json({ error: 'Answer not found', success: false });
      }
      
        
        if(existingAnswer.questionPaperId !== questionId){
            return res.status(401).json({error:"Cannot delete", success: false});
        }

      // Delete the answer
      await AnswerSheet.findByIdAndDelete(answerId);

      await notifyPermissionsChanged([req.user.username], req.user);
  
      // Return a success message
      res.json({ message: 'Answer deleted successfully', token: req.user._token_ });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  

module.exports = router;
