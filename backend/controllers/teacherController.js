const { teachers } = require('../models/teacher')
const logger = require('../config/logger')

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const parsePagination = (page, limit, defaultPage = 1, defaultLimit = 20) => {
  const parsedPage = parseInt(page) || defaultPage;
  const parsedLimit = parseInt(limit) || defaultLimit;
  return {
    page: Math.max(1, parsedPage),
    limit: Math.min(100, Math.max(1, parsedLimit))
  };
};

const GetTeachers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const { page: validPage, limit: validLimit } = parsePagination(page, limit);
        
        let query = { isActive: true };
        
        if (search && search.trim()) {
            const escapedSearch = escapeRegex(search.trim());
            query.name = { $regex: escapedSearch, $options: 'i' };
        }

        const skip = (validPage - 1) * validLimit;
        
        const total = await teachers.countDocuments(query);
        const teacherList = await teachers.find(query)
            .skip(skip)
            .limit(validLimit)
            .sort({ createdAt: -1 });

        const teacherData = teacherList.map(t => {
            const obj = t.toObject();
            return {
                id: obj._id,
                name: obj.name,
                description: obj.description,
                rating: obj.ratingCount > 0 ? (obj.ratingSum / obj.ratingCount).toFixed(1) : 0,
                ratingCount: obj.ratingCount
            };
        });

        res.status(200).json({
            success: true,
            data: teacherData,
            pagination: {
                page: validPage,
                limit: validLimit,
                total,
                pages: Math.ceil(total / validLimit)
            }
        });
    } catch (error) {
        logger.error('Get teachers error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while retrieving teachers'
        });
    }
};

const GetTeacherById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const teacher = await teachers.findById(id);
        
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }

        const obj = teacher.toObject();
        const rating = obj.ratingCount > 0 ? (obj.ratingSum / obj.ratingCount).toFixed(1) : 0;

        res.status(200).json({
            success: true,
            data: {
                id: obj._id,
                name: obj.name,
                description: obj.description,
                rating,
                ratingCount: obj.ratingCount
            }
        });
    } catch (error) {
        logger.error('Get teacher error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while retrieving teacher'
        });
    }
};

const GetTeacherRatings = async (req, res) => {
    try {
        const { ratings } = require('../models/rating');
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const { page: validPage, limit: validLimit } = parsePagination(page, limit, 1, 10);
        
        const skip = (validPage - 1) * validLimit;
        
        const total = await ratings.countDocuments({ teacherId: id });
        const ratingList = await ratings.find({ teacherId: id })
            .skip(skip)
            .limit(validLimit)
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: ratingList,
            pagination: {
                page: validPage,
                limit: validLimit,
                total,
                pages: Math.ceil(total / validLimit)
            }
        });
    } catch (error) {
        logger.error('Get ratings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while retrieving ratings'
        });
    }
};

const CreateTeacher = async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Teacher name is required'
            });
        }

        const teacher = await teachers.create({
            name: name.trim(),
            description: description || '',
            isActive: true,
            ratingCount: 0,
            ratingSum: 0
        });

        res.status(201).json({
            success: true,
            message: 'Teacher created successfully',
            data: teacher
        });
    } catch (error) {
        logger.error('Create teacher error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating teacher'
        });
    }
};

module.exports = {
    GetTeachers,
    GetTeacherById,
    GetTeacherRatings,
    CreateTeacher
};
