const mongoose = require('mongoose');

const upvoteScheme = new mongoose.Schema({
    _id:{ type:  mongoose.Schema.Types.ObjectId, required: true },
    message: { type:  mongoose.Schema.Types.ObjectId, required: true, ref: 'Message' },
    user: { type:  mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    value: { type: Number, required: true, min: [-1, "Value should be between -1 and 1"], max: [1, "Value should be between -1 and 1"]}
});

module.exports = mongoose.model("Upvote", upvoteScheme);