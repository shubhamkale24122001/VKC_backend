const express = require('express');
const router = express.Router();
const Group = require('../../schemas/group_schema');
const User = require('../../schemas/user_schema');
const QuestionPaper = require("../../schemas/question_paper_schema");
const {authenticateToken, notifyPermissionsChanged} = require('../../user_verification/jwt_authentication');
const {validateGroupAccess, validateAdmin, validateGroupAdminAccess, validateGroupCreator} = require('../../utility/user_access_check');
const mongoose = require('mongoose');


router.get('/userGroups', authenticateToken,async (req,res)=>{
  try{
    const groups = await Group.find({_id:{$in: req.user.groupId.map((ids)=>new mongoose.Types.ObjectId(ids))}});
    res.status(200).json({groups, token: req.user_token_, success: true});
  }catch(err){
    console.error(err);
    res.status(500).json({message:'Internal Server Error', success: false});
  }
});

router.get('/userAdminGroups', authenticateToken,async (req,res)=>{
  try{
    const groups = await Group.find({_id:{$in: req.user.adminAccessGroup.map((obj)=>new mongoose.Types.ObjectId(obj.entityId))}});
    console.log(groups);
    res.status(200).json({groups, token: req.user_token_, success: true});
  }catch(err){
    console.error(err);
    res.status(500).json({message:'Internal Server Error', success: false});
  }
});


// GET a specific group
router.get('/:groupId', authenticateToken, validateGroupAccess, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) {
          return res.status(404).json({ message: 'Cannot find group' });
        }

        const {name, groupId, location} = group;
        res.sendStatus(200).json({group:group, success:true, token: req.user._token_});

    } catch (err) {
        return res.status(500).json({ message: err.message, success: false });
      }
});

router.get('/:groupId/questions', authenticateToken, validateGroupAccess, async (req, res) => {
  try {
      const group = await Group.findById(req.params.groupId);
      if (!group) {
        return res.status(404).json({ message: 'Cannot find group' });
      }

      const questions  = await QuestionPaper.find({_id:{$in:group.questionPaperId}});

      res.status(200).json({questions:questions, success:true, token: req.user._token_});

  } catch (err) {
      console.err(err);
      return res.status(500).json({ message: err.message, success: false });
    }
});


// POST a new group
router.post('/', authenticateToken, validateAdmin, async (req, res) => {
  console.log(req.body);
  const group = new Group({
    name: req.body.name,
    location: req.body.location,
    creator: req.user.username
  });

  console.log(group);

  group.validUsers.push(req.user.username);
  group.adminAccessUsers.push(req.user.username);

  try {
    const newGroup = await group.save();
    const user = await User.findOne({username: req.user.username});
    console.log(user);
    user.groupId.push(newGroup._id);
    user.adminAccessGroup.push({entityId: newGroup._id, level: 0});
    await user.save();

    const {name, groupId, location} = group;
    let _token = req.user._token_;
    console.log(req.user);
    await notifyPermissionsChanged([req.user.username],req.user);
    console.log(req.user);
    console.log(req.user._token_ === _token);
    res.status(201).json({message:"group successfully created", success:true, token: req.user._token_});
  } catch (err) {
    res.status(400).json({ message: err.message, success: false });
  }
});

// PUT (update) a specific group
router.put('/:groupId/addQuestion/:questionPaperId', authenticateToken, validateGroupAdminAccess, async (req, res) => {

  try {
    const existingGroup  = await Group.findById(req.params.groupId);
    if(!existingGroup){
        return res.status(404).json({ message: 'Cannot find group', success: false });
    }

    existingGroup.questionPaperId.push(req.params.questionPaperId);
    const validUsers = existingGroup.validUsers;

    await User.updateMany({username:{$in: validUsers}},{$push:{questionPaperId: new mongoose.Types.ObjectId(req.params.questionPaperId)}});

    const updatedGroup = await existingGroup.save();
    const {name, groupId, location} = updatedGroup;
    res.status(200).json({group:updatedGroup, success:true, token: req.user._token_});
  } catch (err) {
    res.status(400).json({ message: err.message , success: false});
  }
});

router.put('/:groupId/addQuestions', authenticateToken, validateGroupAdminAccess, async (req, res) => {

  try {
    const existingGroup  = await Group.findById(req.params.groupId);
    if(!existingGroup){
        return res.status(404).json({ message: 'Cannot find group', success: false });
    }


    existingGroup.questionPaperId.push(...req.body);
    const validUsers = existingGroup.validUsers;

    await User.updateMany({username:{$in: validUsers}},{$push:{groupId: {$each: req.body.map((id)=> new mongoose.Types.ObjectId(id))}}});

    const updatedGroup = await existingGroup.save();
    const {name, groupId, location} = updatedGroup;
    await notifyPermissionsChanged(validUsers, req.user);
    res.status(200).json({group:updatedGroup, success:true, token: req.user._token_});
  } catch (err) {
    res.status(400).json({ message: err.message , success: false});
  }
});


router.put('/:groupId/removeQuestions', authenticateToken, validateGroupAdminAccess, async (req, res) => {

  try {
    const existingGroup  = await Group.findById(req.params.groupId);
    if(!existingGroup){
        return res.status(404).json({ message: 'Cannot find group', success: false });
    }

    console.log(existingGroup.questionPaperId);
    // console.log(req.body.includes(new mongoose.Types.ObjectId(existingGroup.questionPaperId[1])));
    existingGroup.questionPaperId = existingGroup.questionPaperId.filter((ele)=> !req.body.includes(ele.toString()));
    console.log(req.body);
    console.log(existingGroup.questionPaperId);

    const validUsers = existingGroup.validUsers;

    await User.updateMany({username:{$in: validUsers}},{$pull:{groupId: {$in: req.body.map((id)=> new mongoose.Types.ObjectId(id))}}});

    const updatedGroup = await existingGroup.save();
    const {name, groupId, location} = updatedGroup;
    await notifyPermissionsChanged(validUsers, req.user);
    res.status(200).json({group:updatedGroup, success:true, token: req.user._token_});
  } catch (err) {
    res.status(400).json({ message: err.message , success: false});
  }
});

// DELETE a specific group
router.delete('/delete/:groupId', authenticateToken, validateGroupCreator, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (group == null) {
      return res.status(404).json({ message: 'Cannot find group', success: false });
    }

    const {validUsers, _id} = group;
    await User.updateMany({username:{$in:validUsers}}, {$pull:{groupId: _id, adminAccessGroup:{entityId: _id}}},{multi: true});

    await notifyPermissionsChanged(validUsers, req.user);

    await Group.findByIdAndDelete(req.params.groupId);
    res.json({ message: 'Group deleted' , success:true});
  } catch (err) {
    res.status(500).json({ message: err.message , success: false});
  }
});


module.exports = router;
