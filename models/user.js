const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const userScheme = new mongoose.Schema({
    _id:{ type:  mongoose.Schema.Types.ObjectId, required: true },
    groups: { type: [{ type:mongoose.Schema.Types.ObjectId, ref: 'Group'}], required: true, default: []},
    name: { type: String, required: true},
    email_address: { type: String, required: true, unique: true,
        match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    },
    psw: { type: String, required: true}
});

userScheme.pre('save', function (next) {
    let user = this;
    bcrypt.hash(user.psw, 10, function (err, hash) {
        if (err) {
            return next(err); }
        user.psw = hash;
        next();
    })
});

userScheme.statics.authenticate = function (email, password, callback) {
    this.findOne({email_address: email })
        .exec(function (err, user) {
            if (err) {
                return callback(err)
            } else if (!user) {
                let err = new Error('User not found!');
                err.status = 401;
                return callback(err);
            } else {
                bcrypt.compare(password , user.psw, function (err, result) {
                    if (result === true) {
                        return callback(null, user);
                    } else {
                        return callback('Wrong password!');
                    }
                })
            }
        });
};

var User = mongoose.model("User", userScheme);
module.exports = User;