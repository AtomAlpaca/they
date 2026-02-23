const mongoose = require('mongoose')

const teacherSchema = new mongoose.Schema({
    name : {
        type : String,
        required : [true, 'Teacher\'s name is required']
    },
    description : {
        type : String,
        required : [true, 'Teacher\'s description is required'],
        default : ' '
    },
    ratingCount : {
        type : Number,
        required : true,
        default : 0
    },
    ratingSum : {
        type : Number,
        required : true,
        default : 0
    },
    isActive : {
        type : Boolean,
        default : false
    },
})

const teachers = mongoose.model('TeacherRepo', teacherSchema)

module.exports = { teachers }