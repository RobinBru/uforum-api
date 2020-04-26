var express = require('express');
var path = require('path');
var router = express.Router();
var User = require('../models/user');
var Group = require('../models/group');
var Message = require('../models/message');

router.delete('/user/:userId', function (req, res, next) {
    User.delete({_id: req.params.userId})
        .exec()
        .then(result => {
            res.send("ok");
        })
        .catch(err => {
            res.status(400).json({message: err.message});
        })
});

router.delete('/group/:groupId', function (req, res, next) {
    Group.delete({_id: req.params.groupId})
        .exec()
        .then(result => {
            res.send("ok");
        })
        .catch(err => {
            res.status(400).json({message: err.message});
        })
});

router.delete('/message/:messageId', function (req, res, next) {
    Message.delete({_id: req.params.messageId})
        .exec()
        .then(result => {
            res.send("ok");
        })
        .catch(err => {
            res.status(400).json({message: err.message});
        })
});

router.patch('/user/:userId', function (req, res, next) {
    User.updateOne(
        {_id: req.params.userId},
        req.body
        )
        .exec()
        .then(result => {
            res.send("ok");
        })
        .catch(err => {
            res.status(400).json({message: err.message})
        })
});

router.patch('/group/:groupId', function (req, res, next) {
    Group.updateOne(
        {_id: req.params.groupId},
        req.body
    )
        .exec()
        .then(result => {
            res.send("ok");
        })
        .catch(err => {
            res.status(400).json({message: err.message})
        })
});

router.patch('/message/:messageId', function (req, res, next) {
    Message.updateOne(
        {_id: req.params.messageId},
        req.body
    )
        .exec()
        .then(result => {
            res.send("ok");
        })
        .catch(err => {
            res.status(400).json({message: err.message})
        })
});

module.exports = router;