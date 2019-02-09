const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
console.log(process.env.MLAB_URI);
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track')

app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
// *************
// MODELS
// *************
var Schema = mongoose.Schema;
var userSchema = new Schema({
  name: { type: String, unique: true }
});
var User = mongoose.model('User', userSchema);

var exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now() }
});
var Exercise = mongoose.model('Exercise', exerciseSchema);

// *************
// Endpoints
// *************
app.post('/api/exercise/new-user', (req, res) => {
  if (!req.body.username || req.body.username === '') {
    res.send(`Path 'username' is required`);
  } else {

    var user = new User({ name: req.body.username });
    user.save((err, data) => {
      if (err) {
        res.send(`${req.body.username} already exists`);
      } else {
        res.json({ username: req.body.username, _id: data._id });
      }
    });
  }
});

app.post('/api/exercise/add', (req, res) => {
  if (!req.body.userId || req.body.userId === '') {
    res.send(`'UserId' is required`);
  } else if (!req.body.description || req.body.description === '') {
    res.send(`'Description' is required`);
  } else if (!req.body.duration || req.body.duration === '') {
    res.send(`'duration' is required`);
  } else {
    User.findById(req.body.userId, (err, data) => {
      if (err && err.message.indexOf('Cast to ObjectId failed') !== -1) {
        res.send("No user found");
      } else {
        console.log('here');
        var exercise = new Exercise({ userId: req.body.userId, description: req.body.description, duration: req.body.duration, date: req.body.date ? req.body.date : Date.now() });
        console.log(exercise);
        exercise.save((err, data) => {
          if (err) {
            res.send(err.message);
          } else {
            console.log(data);
            res.json(data);
          }
        });
      }
    });
  }
});

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: 'not found' })
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
