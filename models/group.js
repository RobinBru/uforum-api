const mongoose = require('mongoose');

const groupScheme = new mongoose.Schema({
    _id:{ type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, minLength:1 },
    description: { type: String, default:"" },
    public: { type: Boolean, default: false},
    admins: { type: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}], default: []}
});

module.exports = mongoose.model("Group", groupScheme);