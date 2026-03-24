const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    course: {
        type: String,
        required: true,
        trim: true
    },
    topic: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    inviteCode: {
        type: String,
        unique: true,
        required: true
    },
    meetingOptions: {
        type: {
            platform: {
                type: String,
                enum: ['zoom', 'google-meet', 'teams', 'other'],
                default: 'google-meet'
            },
            link: String,
            schedule: {
                day: String,
                time: String,
                frequency: {
                    type: String,
                    enum: ['once', 'daily', 'weekly'],
                    default: 'weekly'
                }
            }
        },
        default: {}
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Generate unique invite code before saving
groupSchema.pre('save', async function(next) {
    if (!this.inviteCode) {
        this.inviteCode = this.generateInviteCode();
    }
    next();
});

groupSchema.methods.generateInviteCode = function() {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
};

module.exports = mongoose.model('Group', groupSchema);