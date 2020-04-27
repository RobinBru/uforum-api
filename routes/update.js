const express = require('express');
const path = require('path');
const router = express.Router();
const User = require('../models/user');
const Group = require('../models/group');
const Message = require('../models/message');
const Upvote = require('../models/upvote');
const mongoose = require('mongoose');


router.delete('/user/:userId', function(req, res, next) {
  User.deleteOne({ _id: req.params.userId })
    .exec()
    .then(result => {
      res.send("ok");
    })
    .catch(err => {
      res.status(400).json({ message: err.message });
    })
});

router.delete('/group/:groupId', function(req, res, next) {
  Group.deleteOne({ _id: req.params.groupId })
    .exec()
    .then(result => {
        return User.updateMany({groups: req.params.groupId},
            {
                $pull: {groups: req.params.groupId}
            })
            .exec()
    })
    .then(result => {
      res.send("ok");
    })
    .catch(err => {
      res.status(400).json({ message: err.message });
    })
});

router.delete('/message/:messageId', function(req, res, next) {
  Message.deleteOne({ _id: req.params.messageId })
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
  const messageId = req.params.messageId;
  const userId = req.body.userId;
  const value = req.body.value;
  Upvote.findOne({ message: messageId, user: userId })
    .exec()
    .then(result => {
      if (!result) {
        return addUpvote(messageId, userId, value, res);
      } else {
        return updateUpvote(messageId, userId, result.value + value, res);
      }
    }).catch(err => {
      res.status(500).json({ message: err.message });
    });

});


function updateUpvote(messageId, userId, value, res) {
  Upvote.findOneAndUpdate({ message: messageId, user: userId }, { user: userId, value: value })
    .exec()
    .then(result => {
      if (result) {
        res.status(200).send("ok");
      }
    });
}

function addUpvote(messageId, userId, value, res) {
  Message.findById(messageId)
    .exec()
    .then(result => {
      if (!result) {
        throw { message: "Unknown messageId" }
        return;
      }
      User.findById(userId)
        .exec()
        .then(result => {
          if (!result) {
            throw { message: "Unknown userId" }
          }
          let upvote = new Upvote({
            _id: new mongoose.Types.ObjectId(),
            message: messageId,
            user: userId,
            value: value
          });
          upvote.save();
          res.status(200).send("ok")
        }).catch(err => {
          res.status(400).json({ message: err.message });
        })
    })
    .catch(err => {
      res.status(400).json({ message: err.message });
    });
}

module.exports = router;