var express = require('express');
var path = require('path');
var router = express.Router();
var User = require('../models/user');
const mongoose = require('mongoose');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send("Server reached")
});

router.get('/login', function(req, res, next) {
  let email = req.query.email;
  let psw = req.query.psw;
  if (email && psw) {
      User.authenticate(email, psw, function (error, user) {
      if (error || !user) {
          res.status(401).json({message: "Incorrect email or password"})
      } else {
          let result = {
            id: user._id,
            name: user.name,
            email: user.email_address
          };
          res.status(200).json(result);
      }
    });
  } else {
    res.status(400).json({message: "No email or password"})
  }
});

router.put('/register', function (req, res, next) {
  var userObj = new User({
    _id : new mongoose.Types.ObjectId(),
    name: req.body.name,
    email_address: req.body.email,
    psw: req.body.psw
  });
  userObj.save((err, result)=>{
    if(err){
      res.status(400).json({message: err.message})
    } else
      res.status(200).json({
        id: result._id,
        name: result.name,
        email: result.email_address,
        psw: result.psw
      });
  })
});

module.exports = router;
