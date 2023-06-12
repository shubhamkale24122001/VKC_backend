const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const {atlas_password, atlas_username} = require("./constants");
// Connect to MongoDB
const uri = `mongodb+srv://${atlas_username}:${atlas_password}@cluster0.zy26u5p.mongodb.net/vkc_backend?retryWrites=true&w=majority`;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));
// mongoose.connect('mongodb://localhost:27017/vkc_backend', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
//   .then(() => console.log('MongoDB connected'))
//   .catch((err) => console.log(err));

// Parse request bodies
app.use(express.urlencoded({extended: true}));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// remove all expired tokens form db and populate the expired tokens object
const tokenExpiry = require("./utility/token_expiry");
tokenExpiry.removeAllExpired();

// Authentication routes
const loginRoute = require('./routes/authentication/login');
app.use('/api/authentication/login', loginRoute);

const signupRoute = require('./routes/authentication/signup');
app.use('/api/authentication/signup', signupRoute);

const logoutRoute = require('./routes/authentication/logout');
app.use('/api/authentication/logout', logoutRoute);

const answerSheetRoute = require('./routes/survey/answer_sheet');
app.use("/survey/answer", answerSheetRoute);

const groupRoute = require('./routes/survey/groups')
app.use("/survey/group", groupRoute);

const questionPaperRoute = require('./routes/survey/question_paper');
app.use('/survey/question', questionPaperRoute);

const changePermissionsRoute = require('./routes/permissions/change_permissions');
app.use("/permissions/modify",changePermissionsRoute);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));