const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, '教师姓名必填'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    submittedBy: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    adminNote: {
        type: String,
        default: ''
    },
    processedAt: {
        type: Date
    }
}, { timestamps: true });

const submissions = mongoose.model('Submission', submissionSchema);

module.exports = { submissions };
