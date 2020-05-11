const express = require('express');
const path = require('path');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/message');
const Upvote = require('../models/upvote');
const Group = require('../models/group');
const User = require('../models/user')

router.get('/:messageId', function(req, res, next) {
  readMessage(req.params.messageId, req.query.userId)
  let userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ message: "Unknown userId" })
  }
  let message;
  let lastPosted;
  let hintCount;
  let answerCount;

  Message.findById(req.params.messageId)
    .exec()
    .then(result => {
      if (!result) {
        throw { message: "Unknown messageId" }
      }
      message = result;
      return Message.find({ nestedId: result._id })
        .select('type postedOn')
        .sort({ postedOn: -1 })
        .exec()
    })
    .then(result => {
      if (result.length > 0) {
        lastPosted = result[0].postedOn;
      } else {
        lastPosted = message.postedOn;
      }
      hintCount = result.filter(mes => mes.type === "Hint").length;
      answerCount = result.filter(mes => mes.type === "Answer").length;
      return Upvote.findOne({ message: message._id, user: userId }).exec()
    })
    .then(result => {
      if (result) {
        hasUpvoted = result.value;
      } else {
        hasUpvoted = 0;
      }
      res.status(200).json({
        id: message._id,
        title: message.title,
        text: message.description,
        group: message.group,
        nestedIn: message.nestedIn,
        postedOn: message.postedOn,
        isAuthor: message.author == userId,
        newestAnswerSince: lastPosted,
        upvotes: message.upvotes,
        hasUpvoted: hasUpvoted,
        answers: answerCount,
        hints: hintCount,
        tags: message.tags
      })
    })
    .catch(err => {
      res.status(400).json({ message: err.message });
      console.log(err);
    });

});

function readMessage(messageId, userId) {
  User.findById(userId)
  .then((result) => {
    User.updateOne({ _id: userId }, { read: [...result.read, messageId] })
    .then(() => {
      res.status(202).send("ok")
    })
    .catch(err => {
      res.status(400).send("fail");
      console.log(err);
    });
  });
}


function formatAnswer(answer, userId) {
  let hasUpvoted;
  let voteValue;
  let author;
  return Upvote.findOne({ message: answer._id, user: userId })
    .select("user value")
    .exec()
    .then(result => {
      if (result) {
        hasUpvoted = result.value;
      } else {
        hasUpvoted = 0;
      }
      return User.findById(answer.author).exec();
    })
    .then(result => {
      return {
        id: answer._id,
        title: answer.title,
        type: answer.type.toLowerCase(),
        text: answer.content,
        postedOn: formatReturndate(answer.postedOn),
        isAuthor: answer.author == userId,
        upvotes: answer.upvotes,
        hasUpvoted: hasUpvoted,
        tags: answer.tags,
        anonymous: answer.anonymous,
        author: result.name
      }
    })
    .then(result => {
      return Message.find({ nestedIn: answer._id })
        .select('content')
        .exec()
        .then(comments => {
          comments = comments.map(comment => comment.content);
          result.comments = comments;
          return result;
        })
        .catch(() => {
          return result;
        });
    })
    .catch(() => {
      return answer;
    })
}


router.get('/:messageId/answers', function(req, res, next) {
  let userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ message: "Unknown userId" })
  }
  let filter = { nestedIn: req.params.messageId };
  let type = req.query.type;
  if (type) {
    if (type.match(/hint/i)) {
      filter.type = "Hint"
    } else if (type.match(/answer/i)) {
      filter.type = "Answer"
    }
  }
  let page = req.query.page;
  let pageLength = process.env.pageLength * 1;
  if (!page) {
    page = 1
  }
  let start = (page - 1) * pageLength;
  let pagesLeft;
  Message.find(filter)
    .skip(start)
    .limit(pageLength + 1)
    .exec()
    .then(result => {
      pagesLeft = result.length > pageLength;
      result = result.slice(0, pageLength);
      return Promise.all(result.map(ans => formatAnswer(ans, userId)))
    })
    .then(result => {
      res.status(200).json({
        page: page,
        count: result.length,
        startIndex: start,
        endIndex: start + result.length,
        pagesLeft: pagesLeft,
        answers: result
      });
    })
    .catch(err => {
      res.status(400).json({ message: err.message });
      console.log(err);
    });
});

router.get('/:messageId/comments', (req, res, next) => {
  let userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ message: "Unknown userId" })
  }
  const filter = { nestedIn: req.params.messageId, type: "Comment" };
  let page = req.query.page;
  const pageLength = process.env.pageLength * 1;
  if (!page) {
    page = 1
  }
  const start = (page - 1) * pageLength;
  Message.find(filter)
    .skip(start)
    .limit(pageLength + 1)
    .exec()
    .then(result => {
      pagesLeft = result.length > pageLength;
      result = result.slice(0, pageLength);
      return Promise.all(result.map(comment => formatAnswer(comment, userId)))
    })
    .then(result => {
      res.status(200).json({
        page: page,
        count: result.length,
        startIndex: start,
        endIndex: start + result.length,
        pagesLeft: pagesLeft,
        answers: result
      })
    })
    .catch(err => {
      res.status(400).json({ message: err.message });
      console.log(err);
    });
});

router.put('/:messageId/answers', function(req, res, next) {
  let returnValue;
  Message.findById(req.params.messageId)
    .exec()
    .then(result => {
      if (!result) {
        throw { message: "Unknown messageId" }
      }
      const message = result;
      let messageObj = new Message({
        _id: new mongoose.Types.ObjectId(),
        title: req.body.title,
        content: req.body.text,
        type: req.body.type.match(/hint/i) ? "Hint" : "Answer", //TODO: Interface should have type
        author: req.body.author,
        group: result.group,
        nestedIn: result._id,
        postedOn: Date.now(),
        tags: req.body.tags,
        anonymous: req.body.anonymous,
        upvotes: 0
      });
      return messageObj.save();
    })
    .then(result => {
      returnValue = result;
      return User.findById(result.author).exec();
    })
    .then(result => {
      res.status(200).json({
        id: returnValue._id,
        title: returnValue.title,
        text: returnValue.content,
        group: returnValue.group,
        type: returnValue.type.toLowerCase(),
        nestedIn: returnValue.nestedIn,
        tags: returnValue.tags,
        anonymous: returnValue.anonymous,
        author: result.name,
        postedOn: formatReturndate(returnValue.postedOn),
        isPinned: false,
        isRead: false
      })
    })
    .catch(err => {
      res.status(400).json({ message: err.message });
      console.log(err);
    });
});

router.put('/:messageId/comments', (req, res, next) => {
  let returnValue;
  Message.findById(req.params.messageId)
    .exec()
    .then(result => {
      if (!result) {
        throw { message: "Unknown messageId" }
      }
      const message = result;
      let messageObj = new Message({
        _id: new mongoose.Types.ObjectId(),
        title: "comment",
        content: req.body.text,
        type: "Comment",
        author: req.body.author,
        group: result.group,
        nestedIn: result._id,
        postedOn: Date.now(),
        tags: req.body.tags,
        anonymous: req.body.anonymous,
        upvotes: 0
      });
      return messageObj.save();
    })
    .then(result => {
      returnValue = result;
      return User.findById(result.author).exec;
    })
    .then(result => {
      res.status(200).json({
        id: returnValue._id,
        title: returnValue.title,
        text: returnValue.content,
        group: returnValue.group,
        type: returnValue.type.toLowerCase(),
        nestedIn: returnValue.nestedIn,
        tags: returnValue.tags,
        anonymous: returnValue.anonymous,
        author: returnValue.author,
        postedOn: formatReturndate(returnValue.postedOn),
        isPinned: false,
        isRead: false
      })
    })
    .catch(err => {
      res.status(400).json({ message: err.message });
      console.log(err);
    });
});

function formatReturndate(date) {
  const ye = new Intl.DateTimeFormat('en', { year: '2-digit' }).format(date)
  const mo = new Intl.DateTimeFormat('en', { month: 'short' }).format(date)
  const da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date)

  return (`${da} ${mo} ${ye}`)
}

module.exports = router;
