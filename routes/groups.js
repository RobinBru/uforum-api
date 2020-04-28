var express = require('express');
var path = require('path');
var router = express.Router();
var mongoose = require('mongoose');
var Group = require('../models/group');
var User = require('../models/user');
var Message = require('../models/message');
var Upvote = require('../models/upvote');

router.get('/', function(req, res, next) {
  let name = req.query.name;
  let page = req.query.page;
  if (!name) {
    return res.status(400).json({ message: "Empty search not allowed" })
  }
  let pageLength = process.env.pageLength * 1;
  if (!page) {
    page = 1
  }
  let start = (page - 1) * pageLength;
  let regex = new RegExp(name.trim());

  Group.find({ public: true, name: { $regex: regex, $options: "i" } })
    .sort({ name: 1 })
    .skip(start)
    .limit(pageLength + 1)
    .populate("admins", "_id name email_address")
    .exec()
    .then(result => {
      let pagesLeft = result.length > pageLength;
      result = result.slice(0, pageLength);
      res.json({
        page: page,
        count: result.length,
        startIndex: start,
        endIndex: start + result.length,
        pagesLeft: pagesLeft,
        groups: result.map(groep => {
          return {
            id: groep._id,
            name: groep.name,
            text: groep.description,
            public: groep.public,
            moderators: groep.admins.map(user => {
              return {
                name: user.name,
                email: user.email_address
              }
            })
          }
        })
      })
    })
    .catch(err => {
      console.log(err);
      res.status(400).send("failed")
    })
});

router.put('/', function(req, res, next) {
  let creator = req.body.creator;
  if (!creator){
    return res.status(400).send("Creator necessary")
  }
  let moderators = req.body.moderators;
  let moderatorIds;
  let modReturnable = [];
  User.find({ $or: [{_id: creator}, { email_address: { $in: moderators }}] })
      .select('_id name email_address')
      .exec()
      .then(result => {
        modReturnable = result.map(mod => {
          return {name: mod.name, email: mod.email_address}
        });
        moderatorIds = result.map(mod => mod._id);
        let group = new Group({
          _id: new mongoose.Types.ObjectId(),
          name: req.body.name,
          description: req.body.text,
          public: req.body.public,
          admins: moderatorIds
        });
        return group.save()
      })
      .then(result => {
        res.status(200)
            .json({
              id: result._id,
              name: result.name,
              text: result.description,
              public: result.public,
              moderators: modReturnable
            });
        return User.updateMany(
            {_id: {$in: moderatorIds}},
            { $addToSet: { groups: result._id } }
        )
      })
      .then(
          //Yay
      )
      .catch(err => {
        console.log(err);
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

router.get('/:groupId/tags', (req, response, next) => {
  Message.find({ group: req.params.groupId, type: "Question" })
    .exec()
    .then(res => {
      let tags = res.map(question => question.tags).flatMap(res => res);
      let counts = {};
      for (let i = 0; i < tags.length; i++) {
        counts[tags[i]] = 1 + (counts[tags[i]] || 0);
      }
      const result = Object.keys(counts).map(tag => {
        return { text : tag, nrOfUsages : counts[tag]}
      });
      response.status(200).json({
        tags: result
      });
    })
    .catch(err => {
      response.status(400).json({ message: err.message });
      console.log(err);
    });
});


router.get('/:groupId/questions', function(req, res, next) {
  let page = req.query.page;
  let userId = req.query.userId;
  let dateParam = req.query.date;
  let searchQuery = req.query.search;
  if (!userId) {
    return res.status(400).json({ message: "Unknown userId" })
  }
  let pageLength = process.env.pageLength * 1;
  if (!page) {
    page = 1
  }
  let findParameters = { group: req.params.groupId, type: "Question" }
  if (searchQuery) {
    findParameters.title = new RegExp(`.*${searchQuery}.*`, "i");
  }
  let start = (page - 1) * pageLength;
  let pagesLeft;
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
      result = result.slice(0, pageLength).map(mess => formatQuestion(mess, userId))
      return Promise.all(result);
    })
    .then(result => {
      if (req.query.sort === "upvotes") {
        result = result.sort((a, b) => b.upvotes - a.upvotes);
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
      res.status(400).json({ message: err.message });
    console.log(err);
    });
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
      res.status(400).json({ message: err.message });
      console.log(err);
    });
});


module.exports = router;
