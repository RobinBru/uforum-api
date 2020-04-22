const mongoose = require('mongoose');

const messageScheme = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String, required: true, minLength:1 },
    content: { type: String },
    type: { type: String, enum:["Question", "Answer", "Hint"], required: true },
    author: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User"},
    group: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Group"},
    nestedIn: { type: mongoose.Schema.Types.ObjectId, ref: "Message"},
    postedOn: { type: Date, required: true, default: Date.now() },
    tags: { type: [{type: String}], default: [] }
});

module.exports = mongoose.model("Message", messageScheme);