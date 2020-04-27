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
  "@webdevd0-fov8v.mongodb.net/uforum?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  }
);

mongoose.Promise = global.Promise;

var conn = mongoose.connection;

conn.on('connected', () => {
  console.log('MongoDB connected')
});


logger.token('realclfdate', function (req, res) {
    var clfmonth = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];
 var pad2 = function(num) {
  var str = String(num);

  return (str.length === 1 ? '0' : '')
    + str;
};
  var dateTime = new Date();
  var date = dateTime.getDate();
  var hour = dateTime.getHours();
  var mins = dateTime.getMinutes();
  var secs = dateTime.getSeconds();
  var year = dateTime.getFullYear();
  var timezoneofset = dateTime.getTimezoneOffset();
  var sign = timezoneofset > 0 ? '-' : '+';
  timezoneofset = parseInt(Math.abs(timezoneofset)/60);
  var month = clfmonth[dateTime.getUTCMonth()];

  return pad2(date) + '/' + month + '/' + year
    + ':' + pad2(hour) + ':' + pad2(mins) + ':' + pad2(secs)
    + ' '+sign+pad2(timezoneofset)+'00';
});

logger.format('custom', function developmentFormatLine(tokens, req, res) {
  // get the status code if response written
  var status = headersSent(res) ?
    res.statusCode :
    undefined

  // get status color
  var color = status >= 500 ? 31 // red
    :
    status >= 400 ? 33 // yellow
    :
    status >= 300 ? 36 // cyan
    :
    status >= 200 ? 32 // green
    :
    0 // no color

  // get colored function
  var fn = developmentFormatLine[color]

  if (!fn) {
    // compile
    fn = developmentFormatLine[color] = compile('[:realclfdate] \x1b[0m:method :url \x1b[' +
      color + '\[ m:status\]\x1b[0m :response-time ms - :res[content-length]\x1b[0m')
  }

  return fn(tokens, req, res)
})

function headersSent(res) {
  // istanbul ignore next: node.js 0.8 support
  return typeof res.headersSent !== 'boolean' ?
    Boolean(res._header) :
    res.headersSent
}

function compile(format) {
  if (typeof format !== 'string') {
    throw new TypeError('argument format must be a string')
  }

  var fmt = String(JSON.stringify(format))
  var js = '  "use strict"\n  return ' + fmt.replace(/:([-\w]{2,})(?:\[([^\]]+)\])?/g, function(_, name, arg) {
    var tokenArguments = 'req, res'
    var tokenFunction = 'tokens[' + String(JSON.stringify(name)) + ']'

    if (arg !== undefined) {
      tokenArguments += ', ' + String(JSON.stringify(arg))
    }

    return '" +\n    (' + tokenFunction + '(' + tokenArguments + ') || "-") + "'
  })

  // eslint-disable-next-line no-new-func
  return new Function('tokens, req, res', js)
}

conn.on('error', (err) => {
  if (err)
    console.log(err)
});

var app = express();

app.use(logger('custom'));
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
