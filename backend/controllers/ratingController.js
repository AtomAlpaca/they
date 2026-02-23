const { ratings } = require('../models/rating')
const { teachers } = require('../models/teacher')
const logger = require('../config/logger')
const mongoose = require('mongoose')

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && 
         new mongoose.Types.ObjectId(id).toString() === id;
}

const Rate = async (req, res) => {
    try {
        const { teacherId, comment, isAnonymous, rating } = req.body
        const { userId } = req.user

        if (!teacherId || !isValidObjectId(teacherId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid teacherId format'
            });
        }

        const teacher = await teachers.findById(teacherId)

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'This teacher does not exists'
            });
        }

        if (!teacher.isActive) {
             return res.status(403).json({
                success: false,
                message: 'The rating for this teacher is not allowed'
            });
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
              return res.status(401).json({
                success: false,
                message: 'The rating must be a number from 1 to 5'
            });
        }

        const rated = await ratings.findOne({ userId, teacherId })

        if (rated) {
            return res.status(401).json({
                success: false,
                message: 'The user had already rated this teacher'
            });
        }

        if (!comment || comment.length > 32768) {
            return res.status(401).json({
                success: false,
                message: 'The comment is too long'
            });
        }
        
        if (!comment || comment.length < 10) {
            return res.status(401).json({
                success: false,
                message: 'The comment is too short'
            });
        }

        const newrating = await ratings.create({
            teacherId,
            userId,
            comment,
            isAnonymous,
            rating
        })

        const newcount = teacher.ratingCount + 1
        const newsum = teacher.ratingSum + rating
        if (!await teachers.findByIdAndUpdate(teacherId, { "ratingCount" : newcount, "ratingSum" : newsum })) {
                return res.status(403).json({
                success: false,
                message: 'Failed to update teacher rating statistics'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Rating submitted successfully',
            rating : newrating.toObject()
        });
    } catch(error) {
        logger.error('Rating error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during rating'
        });
    }
}

const GetMyRatings = async (req, res) => {
    try {
        const { userId } = req.user;
        
        const ratingList = await ratings.find({ userId })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: ratingList
        });
    } catch (error) {
        logger.error('Get my ratings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while retrieving ratings'
        });
    }
};

module.exports = { Rate, GetMyRatings };