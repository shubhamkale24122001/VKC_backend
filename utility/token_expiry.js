const ExpireToken = require("../schemas/expire_token_schema");
const PermissionsChanged = require("../schemas/permissions_changed_schema");
const {jwtTokenExpirationTime} = require("../constants");

const expiredTokens = {populationComplete: false, body:{}};
const userPermissionsChanged = {populated: false, body:{}};

setInterval(()=>{
    removeAllExpired();
    populateExpiredTokens();
    populateUserPermissionsChanged();
},0.5*60*60*1000) // clean db every 30mins

async function populateExpiredTokens(){
   const res = await ExpireToken.find({expirationTime:{$gte:new Date()}});
   
   res.forEach((doc)=>{
    if(!expiredTokens.body[doc.username]) expiredTokens.body[doc.username]={};
    expiredTokens.body[doc.username][doc.token] = new Date(doc.expirationTime);
   })

   expiredTokens.populationComplete = true
   
}

async function populateUserPermissionsChanged(){
    const res = await PermissionsChanged.find({expirationTime:{$gte:new Date()}});

    res.forEach((doc)=>{
        userPermissionsChanged.body[doc.username] = {expirationTime: new Date(doc.expirationTime), creationTime: new Date(doc.creationTime)};
    })

    userPermissionsChanged.populated=true;
}

async function removeAllExpired(){
    await ExpireToken.deleteMany({expirationTime:{$lt:new Date()}});
    await PermissionsChanged.deleteMany({expirationTime:{$lt:new Date()}});
}

async function removeTokens(tokens){
    await ExpireToken.deleteMany({token:{$in: tokens}});
}

async function removeFromPermissionsChanged(usernames){
    await PermissionsChanged.deleteMany({username:{$in: usernames}});
}

async function addTokenToExpire(token, expirationTime, username){

  const now = new Date();
  if(expiredTokens.body[username]){
    Object.keys(expiredTokens.body[username]).forEach((key)=>{
        if(expiredTokens.body[username][key].getTime() < now.getTime()){
          delete expiredTokens.body[username][key]
        }
      });
  }

  else{
    expiredTokens.body[username] = {};
  }

  expiredTokens.body[username][token] = expirationTime;

    const expToken = new ExpireToken({
        token,
        expirationTime,
        username
    });

    await expToken.save()
}

async function addToPermissionsChanged(usernames){

    const now = new Date();
    const expirationTime = new Date(now.getTime() + jwtTokenExpirationTime*1000);

    // const existingPerChanged = PermissionsChanged.find({username:{$in: usernames}});
    let existing = [];
    let notExisting = [];

    usernames.forEach((user)=>{
        if(userPermissionsChanged.body[user]) existing.push(user);
        else notExisting.push({username: user, creationTime: now, expirationTime: expirationTime});

        userPermissionsChanged.body[user]  = {creationTime: now, expirationTime: expirationTime};
    });

    await PermissionsChanged.updateMany({username:{$in: usernames}}, {creationTime: now, expirationTime: expirationTime});
    await PermissionsChanged.insertMany(notExisting);

}

module.exports={removeAllExpired, addTokenToExpire, populateExpiredTokens, expiredTokens, removeTokens, populateUserPermissionsChanged, removeFromPermissionsChanged, addToPermissionsChanged, userPermissionsChanged};