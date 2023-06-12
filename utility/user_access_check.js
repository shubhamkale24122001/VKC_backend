function validateAdmin(req, res, next){
    // console.log("validateAdmin reached");
    if(!req.user.isAdmin) return res.status(403).json({ message: 'Forbidden' });
    next();
}

function validateQuestionAccess(req, res, next){
    const _id = req.params.questionPaperId
    // console.log(_id);
    // console.log("validateQuestionAccess reached");
    if(!req.user.questionPaperId.find((id)=>id===_id)) return res.status(403).json({ message: 'Forbidden' });
    next();
}


function validateQuestionAdminAccess(req, res, next){
    const _id = req.params.questionPaperId
    // console.log("validateQuestionAdminAccess reached");
    let found=  req.user.adminAccessQuestionPaper.find((accessObj)=>{
        return accessObj["entityId"] === _id
    });
    if(!found) return res.status(403).json({ message: 'Forbidden' });
    next();
}

function validateQuestionCreator(req, res, next){
    const _id = req.params.questionPaperId
    // console.log("validateQuestionCreator reached");
    let found=  req.user.adminAccessQuestionPaper.find((accessObj)=>{
        return accessObj["entityId"] === _id && accessObj["level"] === 0;
    });
    if(!found) return res.status(403).json({ message: 'Forbidden' });
    next();
}


function validateGroupAccess(req, res, next){
    const _id = req.params.groupId;
    if(!req.user.groupId.find((id)=>id===_id)) return res.status(403).json({ message: 'Forbidden' });
    next();
}

function validateGroupAdminAccess(req, res, next){
    const _id =  req.params.groupId;
    if(!req.user.adminAccessGroup.find((accessObj)=> accessObj["entityId"] === _id)) return res.status(403).json({ message: 'Forbidden' });
    next();
}

function validateGroupCreator(req, res, next){
    const _id =  req.params.groupId;
    if(!req.user.adminAccessGroup.find((accessObj)=> accessObj["entityId"] === _id && accessObj["level"] === 0)) return res.status(403).json({ message: 'Forbidden' });
    next();
}


module.exports = {
    validateAdmin, 
    validateQuestionAccess, 
    validateQuestionAdminAccess, 
    validateQuestionCreator,
    validateGroupAccess,
    validateGroupAdminAccess,
    validateGroupCreator
};