const express = require('express');
const path = require('path');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/message');
const Upvote = require('../models/upvote');
const Group = require('../models/group');
const User = require('../models/user')

router.get('/:messageId', function(req, res, next) {
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
      return Upvote.find({ message: message._id }).exec()
    })
    .then(result => {
      let hasUpvoted = result.find(val => val.user == userId);
      if (hasUpvoted) {
        hasUpvoted = hasUpvoted.value;
      } else {
        hasUpvoted = 0;
      }
      let voteValue = result.map(up => up.value).reduce((a, b) => a + b, 0);
      res.status(200).json({
        id: message._id,
        title: message.title,
        text: message.description,
        group: message.group,
        nestedIn: message.nestedIn,
        postedOn: message.postedOn,
        isAuthor: message.author == userId,
        newestAnswerSince: lastPosted,
        upvotes: voteValue,
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

function formatAnswer(answer, userId) {
  return Upvote.find({ message: answer._id })
    .select("user value")
    .exec()
    .then(result => {
      let hasUpvoted = result.find(val => val.user == userId);
      if (hasUpvoted) {
        hasUpvoted = hasUpvoted.value;
      } else {
        hasUpvoted = 0;
      }
      let voteValue = result.map(up => up.value).reduce((a, b) => a + b, 0);
      return {
        id: answer._id,
        title: answer.title,
        type: answer.type.toLowerCase(),
        text: answer.content,
        postedOn: answer.postedOn,
        isAuthor: answer.author == userId,
        upvotes: voteValue,
        hasUpvoted: hasUpvoted,
        tags: answer.tags,
      }
    })
    .then(result => {
      return Message.find({ nestedIn: answer._id })
        .select('content')
        .exec()
        .then(comments => {
          console.log(comments);
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
        tags: req.body.tags
      });
      return messageObj.save();
    })
    .then(result => {
      res.status(200).json({
        id: result._id,
        title: result.title,
        text: result.content,
        group: result.group,
        type: result.type.toLowerCase(),
        nestedIn: result.nestedIn,
        author: result.author,
        tags: result.tags
      })
    })
    .catch(err => {
      res.status(400).json({ message: err.message });
      console.log(err);
    });
});

router.put('/:messageId/comments', (req, res, next) => {
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
        tags: req.body.tags
      });
      return messageObj.save();
    })
    .then(result => {
      res.status(200).json({
        id: result._id,
        title: result.title,
        text: result.content,
        group: result.group,
        type: result.type.toLowerCase(),
        nestedIn: result.nestedIn,
        author: result.author,
        tags: result.tags
      })
    })
    .catch(err => {
      res.status(400).json({ message: err.message });
      console.log(err);
    });
});

module.exports = router;