const express = require('express');
const path = require('path');
const router = express.Router();
const mongoose = require('mongoose');
const Group = require('../models/group');
const User = require('../models/user');
const Message = require('../models/message');
const Upvote = require('../models/upvote');

router.put('/', function(req, res, next) {
  let moderators = req.body.moderators;
  let modReturnable = [];
  User.find({ email_address: { $in: moderators } })
    .select('_id name email_adress')
    .exec()
    .then(result => {
      if (!result.length) {
        throw { message: "Unknown email" }
      } else {
        modReturnable = result.map(mod => { return { name: mod.name, email: mod.email_address } });
        let group = new Group({
          _id: new mongoose.Types.ObjectId(),
          name: req.body.name,
          description: req.body.text,
          public: req.body.public,
          admins: result.map(mod => mod._id)
        });
        return group.save()
      }
    })
    .then(result => {
      res.status(200)
        .json({
          id: result._id,
          name: result.name,
          text: result.description,
          public: result.public,
          moderators: modReturnable
        })
    })
    .catch(err => {
      res.status(400).json({ message: err.message })
    });
});

function formatQuestion(question, userId) {
  let lastPosted;
  let hints;
  let answers;
  return Message.find({ nestedIn: question._id })
    .select('type postedOn')
    .sort({ postedOn: -1 })
    .exec()
    .then(result => {
      if (result.length > 0) {
        lastPosted = result[0].postedOn;
      } else {
        lastPosted = question.postedOn;
      }
      hints = result.filter(mes => mes.type === "Hint").length;
      answers = result.filter(mes => mes.type === "Answer").length;
      return Upvote.find({ message: question._id }).exec()
    })
    .then(result => {
      let hasUpvoted = result.find(val => val.user == userId);
      if (hasUpvoted) {
        hasUpvoted = hasUpvoted.value;
      } else {
        hasUpvoted = 0;
      }
      let voteValue = result.map(up => up.value).reduce((a, b) => a + b, 0);
      return {
        id: question._id,
        title: question.title,
        text: question.content,
        postedOn: question.postedOn,
        isAuthor: question.author == userId,
        newestAnswerSince: lastPosted,
        upvotes: voteValue,
        hasUpvoted: hasUpvoted,
        answers: answers,
        hints: hints,
        tags: question.tags
      }
    })
    .catch(err => {
      return question;
    })
}

router.get('/:groupId/questions', function(req, res, next) {
  let page = req.query.page;
  let userId = req.query.userId;
  let dateParam = req.query.date;
  if (!userId) {
    return res.status(400).json({ message: "Unknown userId" })
  }
  let pageLength = process.env.pageLength * 1;
  if (!page) {
    page = 1
  }
  let start = (page - 1) * pageLength;
  let pagesLeft;
  let findParameters = { group: req.params.groupId, type: "Question" };
  if (dateParam) {
    switch (dateParam) {
      case "day":
        findParameters.postedOn = { $gte: new Date(new Date() - 60 * 60 * 24 * 1000) }
        break;
      case "week":
        findParameters.postedOn = { $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000) }
        break;
      case "month":
        findParameters.postedOn = { $gte: new Date(new Date() - 30 * 7 * 60 * 60 * 24 * 1000) }
        break;
    }
  }
  Message.find(findParameters)
    .sort({ postedOn: -1 })
    .skip(start)
    .limit(pageLength + 1)
    .exec()
    .then(result => {
      pagesLeft = result.length > pageLength;
      result = result.slice(0, pageLength);
      return Promise.all(result.map(mess => { return formatQuestion(mess, userId) }));
    })
    .then(result => {
      if (req.params.sort === "upvotes") {
        result.sort((a, b) => a.upvotes - b.upvotes);
      }
      res.status(200).json({
        page: page,
        count: result.length,
        startIndex: start,
        endIndex: start + result.length,
        pagesLeft: pagesLeft,
        questions: result
      });
    })
    .catch(err => {
      res.status(400).json({ message: err.message })
    })
});

router.put('/:groupId/questions', function(req, res, next) {
  let questObj = new Message({
    _id: new mongoose.Types.ObjectId(),
    title: req.body.title,
    content: req.body.text,
    type: "Question",
    author: req.body.author,
    group: req.params.groupId,
    postedOn: Date.now(),
    tags: req.body.tags
  });
  questObj.save()
    .then(result => {
      res.status(200).json({
        id: result._id,
        title: result.title,
        text: result.content,
        group: result.group,
        author: result.author,
        tags: result.tags
      })
    })
    .catch(err => {
      res.status(400).json({ message: err.message })
    });
});

module.exports = router;