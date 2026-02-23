const mongoose = require('mongoose')

const ratingSchema = new mongoose.Schema({
    teacherId : {
        type : mongoose.Schema.Types.ObjectId,
        required : [true, 'Teacher id is required'],
        ref: 'TeacherRepo'
    },
    userId : {
        type : String,
        required : [true, 'User id is required'],
    },
    comment : {
        type : String,
        required : [true, 'Comment is required'],
        minlength : [10, 'Comment can not be shorter than 10 words'],
        maxlength : [32768, 'Comment is too long'],
        trim : true
    },
    isAnonymous : {
        type : Boolean,
        required : [true, ' '],
        default : false
    },
    rating : {
        type : Number,
        required : [true, 'rating is required'],
        enum : [1, 2, 3, 4, 5],
        default : 5
    }
}, { timestamps: true });

const ratings = mongoose.model('Ratings', ratingSchema)

module.exports = { ratings }