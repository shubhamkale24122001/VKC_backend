const express = require('express');
const router = express.Router();
const User = require('../../schemas/user_schema');
const QuestionPaper = require('../../schemas/question_paper_schema');
const Group = require('../../schemas/group_schema');
const {authenticateToken, notifyPermissionsChanged} = require('../../user_verification/jwt_authentication');
const {validateQuestionAdminAccess, validateGroupAdminAccess} = require('../../utility/user_access_check');
const mongoose = require("mongoose")

// Route to add give access of question paper to users
router.put('/give/access/questionPaper/:questionPaperId/', authenticateToken, validateQuestionAdminAccess, async (req, res) => {
  const { questionPaperId } = req.params;
  const users = req.body;
  try {

    const questionPaper = await QuestionPaper.findById(questionPaperId);
    if(!questionPaper) return res.status(404).json({ message: 'Cannot find question', success: false });

    questionPaper.validUsers.push(...users);
    await questionPaper.save();

    await User.updateMany({username:{$in:users}},{$push:{questionPaperId: new mongoose.Types.ObjectId(questionPaperId)}})

    await notifyPermissionsChanged(users, req.user);
    res.status(200).json({message:"access provided successfully", success: true, token: req.user._token_});
  } catch (err) {
    res.status(500).json({error:err, success: false});
  }
});

// Route to remove access of question paper to users
router.put('/remove/access/questionPaper/:questionPaperId/', authenticateToken, validateQuestionAdminAccess, async (req, res) => {
  const users = req.body;
  const {questionPaperId} = req.params;
  try {

    
    const questionPaper = await QuestionPaper.findById(questionPaperId);
    if(!questionPaper) return res.status(404).json({ message: 'Cannot find question', success: false });

    questionPaper.validUsers = questionPaper.filter((ele)=>!users.includes(ele.toString()));
    await questionPaper.save();

    await User.updateMany({username:{$in:users}},{$pull:{questionPaperId: new mongoose.Types.ObjectId(questionPaperId)}})

    await notifyPermissionsChanged(users, req.user);
    res.status(200).json({message:"access removed successfully", success: true, token: req.user._token_});
  } catch (err) {
    res.status(500).json({error:err, success: false});
  }
});


// Route to give admin access of question paper to users
router.put('/give/adminAccess/questionPaper/:questionPaperId/', authenticateToken, validateQuestionAdminAccess, async (req, res) => {
    const users = req.body;
    const {questionPaperId} = req.params;
    try {   
      const questionPaper = await QuestionPaper.findById(questionPaperId);
      if(!questionPaper) return res.status(404).json({ message: 'Cannot find question', success: false });

      questionPaper.adminAccessUsers.push(...users);
      questionPaper.validUsers = questionPaper.validUsers.filter((ele)=>!users.includes(ele.toString));
      questionPaper.validUsers.push(...users);
      await questionPaper.save();

      await User.updateMany({username:{$in:users}},{$push:{adminAccessQuestionPaper: {entityId: new mongoose.Types.ObjectId(questionPaperId), level: req.user.adminAccessQuestionPaper.level+1}}});

      await notifyPermissionsChanged(users, req.user);
      res.status(200).json({message:"admin access given successfully", success: true, token: req.user._token_});
    } catch (err) {
        res.status(500).json({error:err, success: false});
    }
});

// Route to remove admin access of question paper to users
router.put('/remove/adminAccess/questionPaper/:questionPaperId/', authenticateToken, validateQuestionAdminAccess, async (req, res) => {
    const users = req.body;
    const {questionPaperId} = req.params;
    try {
      const questionPaper = await QuestionPaper.findById(questionPaperId);
      if(!questionPaper) return res.status(404).json({ message: 'Cannot find question', success: false });

      questionPaper.adminAccessUsers = questionPaper.adminAccessUsers.filter((ele)=>!users.includes(ele.toString()));

      await User.updateMany({username:{$in:users}},{$pull:{adminAccessQuestionPaper: {entityId: new mongoose.Types.ObjectId(questionPaperId), level: {$gt:req.user.adminAccessQuestionPaper.level}}}});

      const userAccessNotRemoved = await User.find({username:{$in: users},adminAccessQuestionPaper: {entityId: new mongoose.Types.ObjectId(questionPaperId), level: {$lte:req.user.adminAccessQuestionPaper.level}}});

      questionPaper.adminAccessUsers.push(...userAccessNotRemoved);
      await questionPaper.save();

      await notifyPermissionsChanged(users, req.user);

      if(userAccessNotRemoved.length===0) res.status(200).json({message:"admin access removed successfully", success: true, token: req.user._token_});
      else res.status(200).json({message:"You do not have authority to remove admin access of all the users", accessNotRemoved: userAccessNotRemoved ,success: true, token: req.user._token_});
    } catch (err) {
        res.status(500).json({error:err, success: false});
    }
});



// Route to add give access of question paper to users
router.put('/give/access/group/:groupId/', authenticateToken, validateGroupAdminAccess, async (req, res) => {
    const { groupId } = req.params;
    const users = req.body;
    try {
      const group = await Group.findById(groupId);
      if(!group) return res.status(404).json({ message: 'Cannot find question', success: false });
    
      group.validUsers.push(...users);
      await group.save();

      await User.updateMany({username:{$in:users}},{$push:{groupId: new mongoose.Types.ObjectId(groupId)}})

      await notifyPermissionsChanged(users, req.user);
      res.status(200).json({message:"access provided successfully", success: true, token: req.user._token_});
    } catch (err) {
      res.status(500).json({error:err, success: false});
    }
});
  
// Route to remove access of question paper to users
router.put('/remove/access/group/:groupId/', authenticateToken, validateGroupAdminAccess, async (req, res) => {
    const users = req.body;
    const {groupId} = req.params;
    try {
        const group = await Group.findById(groupId);
        if(!group) return res.status(404).json({ message: 'Cannot find question', success: false });
      
        group.validUsers = group.validUsers.filter((ele)=> !users.includes(ele.toString()));
        await group.save();
        await User.updateMany({username:{$in:users}},{$pull:{groupId: new mongoose.Types.ObjectId(groupId)}})

        await notifyPermissionsChanged(users, req.user);
        res.status(200).json({message:"access removed successfully", success: true, token: req.user._token_});
    } catch (err) {
        res.status(500).json({error:err, success: false});
    }
});


// Route to give admin access of question paper to users
router.put('/give/adminAccess/group/:groupId/', authenticateToken, validateGroupAdminAccess, async (req, res) => {
    const users = req.body;
    const {groupId} = req.params;
    try {
        const group = await QuestionPaper.findById(groupId);
        if(!questionPaper) return res.status(404).json({ message: 'Cannot find question', success: false });
  
        group.adminAccessUsers.push(...users);
        group.validUsers = group.validUsers.filter((ele)=>!users.includes(ele.toString()));
        group.validUsers.push(...users);
        await group.save();
        await User.updateMany({username:{$in:users}},{$push:{adminAccessGroup: {entityId: new mongoose.Types.ObjectId(groupId), level: req.user.adminAccessGroup.level+1}}});

        await notifyPermissionsChanged(users, req.user);
        res.status(200).json({message:"admin access given successfully", success: true, token: req.user._token_});
    } catch (err) {
        res.status(500).json({error:err, success: false});
    }
});

// Route to remove admin access of question paper to users
router.put('/remove/adminAccess/group/:groupId/', authenticateToken, validateGroupAdminAccess, async (req, res) => {
    const users = req.body;
    const {groupId} = req.params;
    try {
        const group = await QuestionPaper.findById(groupId);
        if(!group) return res.status(404).json({ message: 'Cannot find question', success: false });
  
        group.adminAccessUsers = group.adminAccessUsers.filter((ele)=>!users.includes(ele.toString()));

        await User.updateMany({username:{$in:users}},{$pull:{adminAccessQuestionPaper: {entityId: new mongoose.Types.ObjectId(groupId), level: {$gt:req.user.adminAccessGroup.level}}}});

        const userAccessNotRemoved = await User.find({username:{$in: users},adminAccessQuestionPaper: {entityId: new mongoose.Types.ObjectId(groupId), level: {$lte:req.user.adminAccessGroup.level}}});
        
        group.adminAccessUsers.push(...userAccessNotRemoved);
        await group.save();

        await notifyPermissionsChanged(users, req.user);

        if(userAccessNotRemoved.length===0) res.status(200).json({message:"admin access removed successfully", success: true, token: req.user._token_});
        else res.status(200).json({message:"You do not have authority to remove admin access of all the users", accessNotRemoved: userAccessNotRemoved ,success: true, token: req.user._token_});
    } catch (err) {
        res.status(500).json({error:err, success: false});
    }
});


module.exports = router;
