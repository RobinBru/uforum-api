const express = require('express');
const path = require('path');
const router = express.Router();
const User = require('../models/user');
const Group = require('../models/group');
const Message = require('../models/message');
const Upvote = require('../models/upvote')

router.delete('/user/:userId', function(req, res, next) {
  User.delete({ _id: req.params.userId })
    .exec()
    .then(result => {
      res.send("ok");
    })
    .catch(err => {
      res.status(400).json({ message: err.message });
    })
});

router.delete('/group/:groupId', function(req, res, next) {
  Group.delete({ _id: req.params.groupId })
    .exec()
    .then(result => {
      res.send("ok");
    })
    .catch(err => {
      res.status(400).json({ message: err.message });
    })
});

router.delete('/message/:messageId', function(req, res, next) {
  Message.delete({ _id: req.params.messageId })
    .exec()
    .then(result => {
      res.send("ok");
    })
    .catch(err => {
      res.status(400).json({ message: err.message });
    })
});

router.patch('/user/:userId', function(req, res, next) {
  User.updateOne({ _id: req.params.userId },
      req.body
    )
    .exec()
    .then(result => {
      res.send("ok");
    })
    .catch(err => {
      res.status(400).json({ message: err.message })
    })
});

router.patch('/group/:groupId', function(req, res, next) {
  Group.updateOne({ _id: req.params.groupId },
      req.body
    )
    .exec()
    .then(result => {
      res.send("ok");
    })
    .catch(err => {
      res.status(400).json({ message: err.message })
    })
});

router.patch('/message/:messageId', function(req, res, next) {
  Message.updateOne({ _id: req.params.messageId },
      req.body
    )
    .exec()
    .then(result => {
      res.send("ok");
    })
    .catch(err => {
      res.status(400).json({ message: err.message })
    })
});

router.patch('/message/:messageId/upvotes', (req, res, next) => {
  Upvote.findOneAndUpdate({ message: req.params.messageId, user: req.body.userId },
      req.body
    )
    .exec()
    .then(result => {
      if (!result) {
        throw { message: "unknown upvote" };
      }
      res.send("ok");
    })
    .catch(err => {
      res.status(400).json({ message: err.message })
    })
});

router.delete('/message/:messageId/upvotes', function(req, res, next) {
  Upvote.findOneAndDelete({ user: req.body.userId, message: req.params.messageId })
    .exec()
    .then(result => {
      if (!result) {
        throw { message: "unknown upvote" };
      }
      res.send("ok");
    })
    .catch(err => {
      res.status(400).json({ message: err.message });
    })
});

module.exports = router;