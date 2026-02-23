// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username : {
        type : String,
        required : [true, 'Username is required'],
        unique : true,
        trim : true,
        minlength : [3, 'Username must be at least 3 characters'],
        maxlength : [30, 'Username cannot exceed 30 characters']
    },
    email : {
        type : String,
        required: [true, 'Email is required'],
        unique : true,
        trim : true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        maxlength : [30, 'Password cannot exceed 30 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    profile: {
        firstName: String,
        lastName: String,
        avatarUrl: String
    }
});

// 密码加密中间件
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return ;
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

const repo = mongoose.model('UserRepo', userSchema)

module.exports = { repo }
