const jwt = require('jsonwebtoken');
const { jwtSecret, jwtTokenExpirationTime } = require('../constants');
const {addTokenToExpire, expiredTokens, removeTokens, populateExpiredTokens, userPermissionsChanged, populateUserPermissionsChanged, addToPermissionsChanged} = require('../utility/token_expiry');
const User = require("../schemas/user_schema");

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, jwtSecret, async (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired' , success: false});
      }
      return res.status(403).json({ message: 'Forbidden', success: false });
    }

    if(!expiredTokens.populationComplete) await populateExpiredTokens();
    if(!userPermissionsChanged.populated) await populateUserPermissionsChanged();

    if(expiredTokens.body[user.username]?.[token]) return res.status(403).json({ message: 'Token has Expired' , success: false});

    user._token_ = token;
    if(userPermissionsChanged.body[user.username] && userPermissionsChanged.body[user.username].creationTime.getTime() > (new Date(user.exp*1000)).getTime()){
      await UpdateUserToken(user);
    }

    req.user = user;
    console.log("from authenticateToken");
    console.log(new Date(user.exp*1000))

    console.log(user);
    next();
  });
}

async function expireUserToken(user){
  const userCred = jwt.decode(user._token_);
  const exp_time = new Date(userCred.exp*1000) // multiplied by 1000 as js needs epoch in milliseconds
  console.log("from generateUpdatedToken");
  console.log(userCred);
  
  if(!expiredTokens.populationComplete) await populateExpiredTokens();
  addTokenToExpire(user._token_,exp_time, user.username);

}

async function notifyPermissionsChanged(usernames, user){
  if(!userPermissionsChanged.populated) await populateUserPermissionsChanged();
  addToPermissionsChanged(usernames);
  
  if(usernames.find((username)=>username===user.username)) await UpdateUserToken(user);
}

async function UpdateUserToken(user){
  await expireUserToken(user)
  
  const username = user.username
  const {isAdmin, questionPaperId, answeredQuestionPaperId, adminAccessQuestionPaper, groupId, adminAccessGroup} = await User.findOne({username});
  // user = {username, isAdmin, questionPaperId, answeredQuestionPaperId, adminAccessQuestionPaper, groupId, adminAccessGroupPaper};
  user.isAdmin = isAdmin;
  user.questionPaperId = questionPaperId;
  user.answeredQuestionPaperId = answeredQuestionPaperId;
  user.adminAccessQuestionPaper = adminAccessQuestionPaper;
  user.groupId = groupId;
  user.adminAccessGroup = adminAccessGroup;
      
  user._token_ = generateToken(user);
}

function generateToken(user) {
  const username = user.username;
  const {isAdmin, questionPaperId, answeredQuestionPaperId, adminAccessQuestionPaper, groupId, adminAccessGroup} = user;
  return jwt.sign({username, isAdmin, questionPaperId, answeredQuestionPaperId, adminAccessQuestionPaper, groupId, adminAccessGroup}, jwtSecret, { expiresIn: jwtTokenExpirationTime });
}

module.exports = { authenticateToken, generateToken, UpdateUserToken, expireUserToken, notifyPermissionsChanged };
