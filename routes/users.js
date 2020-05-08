const express = require('express');
const path = require('path');
const router = express.Router();
const User = require('../models/user');
const Group = require('../models/group');
const mongoose = require('mongoose');

/* GET users listing. */
router.get('/:userId', function(req, res, next) {
  User.findById(req.params.userId)
    .select("_id name email_address")
    .exec()
    .then((result) => {
      if (result) {
        res.status(200).json({
          id: result._id,
          name: result.name,
          email: result.email_address
        })
      } else {
        res.status(404).json({ message: "Unknown userId" })
      }
    })
    .catch((err) => {
      res.status(400).json({ message: "Something went wrong" });
      console.log(err);
    });
});

router.get('/:userId/groups', function(req, res, next) {
  let page = req.query.page;
  let pageLength = process.env.pageLength;
  if (!page) {
    page = 1
  }
  let start = (page - 1) * pageLength;
  User.findById(req.params.userId)
    .select("groups")
    .populate("groups")
    .exec()
    .then((result) => {
      if (result) {
        let groups = result.groups.slice(start, start + pageLength);
        Group.find({ _id: { $in: groups } })
          .select("_id name description public admins")
          .populate("admins", "_id name email_adress")
          .exec()
          .then((resul) => {
            let resList = resul.map((group) => {
              return {
                id: group._id,
                name: group.name,
                description: group.description,
                public: group.public,
                isModerator: group.admins.find(mod => mod._id == req.params.userId) !== undefined,
                //TODO: last message since
                moderators: group.admins.map(mod => { return { name: mod.name, email: mod.email_address } }) //TODO: do we give id?
              }
            });
            res.status(200).json({
              page: page,
              count: groups.length,
              startIndex: start,
              endIndex: start + groups.length,
              pagesLeft: result.groups.length >= start + pageLength,
              groups: resList
            })
          })
          .catch((err) => {
            res.status(400).json({ message: "Something went wrong" });
            console.log(err);
          });
      } else {
        res.status(404).json({ message: "Unknown userId" })
      }
    })
    .catch((err) => {
      res.status(400).json({ message: "Something went wrong" });
      console.log(err);
    });
});

router.put('/:userId/groups', function(req, res, next) {
  let groupId = req.body.id;
  let group;
  Group.findOne({ _id: groupId })
    .populate("admins", "_id name")
    .exec()
    .then((result) => {
      group = result;
      if (result) {
        return User.updateOne({ _id: req.params.userId }, { $addToSet: { groups: groupId } })
      } else {
        throw { message: "Unknown groupId" };
      }
    })
    .then(result => {
      res.status(200).json({
        id: group._id,
        name: group.name,
        text: group.description,
        public: group.public,
        isModerator: group.admins.find(adm => adm._id == req.params.userId) !== undefined,
        //lastMessageSince: "<someTimestamp>", TODO
        moderators: group.admins.map(adm => { return { name: adm.name } })
      });
    })
    .catch((err) => {
      res.status(404).json(err);
      console.log(err);
    });
});

/*Leave a group*/
router.delete('/:userId/groups/:groupId', function(req, res, next) {
  User.updateOne({ _id: req.params.userId }, { $pull: { groups: req.params.groupId } })
    .then(result => {
      return Group.updateOne({ _id: req.params.groupId }, { $pull: { admins: req.params.userId } })
    })
    .then(result => {
      res.status(200).send("ok")
    })
    .catch(err => {
      res.status(400).send("fail");
      console.log(err);
    })
});
module.exports = router;


/*Pin a message*/
router.put('/:userId/pins', (req, res, next) => {
  User.findById(req.params.userId)
    .then((result) => {
      User.updateOne({ _id: req.params.userId }, { pins: [...result.pins, req.body.messageId] })
        .then(() => {
          res.status(202).send("ok")
        })
        .catch(err => {
          res.status(400).send("fail");
          console.log(err);
        });
    });
});
/*Add message to read messages*/
router.put('/:userId/read', (req, res, next) => {
  User.findById(req.params.userId)
  .then((result) => {
    User.updateOne({ _id: req.params.userId }, { read: { [...result.read, req.body.messageId] }})
    .then(() => {
      res.status(202).send("ok")
    })
    .catch(err => {
      res.status(400).send("fail");
      console.log(err);
    });
  });
});
