const { Schema, model } = require('mongoose');

const vouchSchema = new Schema({
    voucherId: {
        type: String,
        required: true,
    },
    targetUserId: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: true,
        maxLength: 500,
    },
    voucherTag: {
        type: String,
        required: true,
    },
    targetTag: {
        type: String,
        required: true,
    },
}, { timestamps: true });

module.exports = model('Vouch', vouchSchema);