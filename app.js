var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var groupsRouter = require('./routes/groups');
var messagesRouter = require('./routes/messages');
var updateRouter = require('./routes/update');

mongoose.connect("mongodb+srv://" +
    process.env.mongodbUN + ":" +
    process.env.mongodbPW +
    "@webdevd0-fov8v.mongodb.net/uforum?retryWrites=true&w=majority",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
    }
);

mongoose.Promise = global.Promise;

var conn = mongoose.connection;

conn.on('connected',()=>{
    console.log('MongoDB connected')
});

conn.on('error',(err)=>{
    if(err)
        console.log(err)
});

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/', updateRouter);
app.use('/user', usersRouter);
app.use('/groups', groupsRouter);
app.use('/message', messagesRouter);

module.exports = app;
