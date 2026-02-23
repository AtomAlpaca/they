const { repo: User } = require('../models/user');
const { teachers } = require('../models/teacher');
const { ratings } = require('../models/rating');
const logger = require('../config/logger');

const GetAllTeachers = async (req, res) => {
    try {
        const teacherList = await teachers.find().sort({ createdAt: -1 }).lean();
        res.status(200).json({ success: true, data: teacherList });
    } catch (error) {
        logger.error('Admin get teachers error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const CreateTeacher = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ success: false, message: '教师姓名必填' });
        }

        const teacher = await teachers.create({
            name: name.trim(),
            description: description || '',
            isActive: true,
            ratingCount: 0,
            ratingSum: 0
        });

        res.status(201).json({ success: true, message: '教师创建成功', data: teacher });
    } catch (error) {
        logger.error('Admin create teacher error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const ApproveTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const teacher = await teachers.findByIdAndUpdate(id, { isActive: true }, { new: true });
        
        if (!teacher) {
            return res.status(404).json({ success: false, message: '教师不存在' });
        }

        res.status(200).json({ success: true, message: '教师审核通过' });
    } catch (error) {
        logger.error('Admin approve teacher error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const DeleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        
        await teachers.findByIdAndDelete(id);
        await ratings.deleteMany({ teacherId: id });

        res.status(200).json({ success: true, message: '教师已删除' });
    } catch (error) {
        logger.error('Admin delete teacher error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const GetAllUsers = async (req, res) => {
    try {
        const userList = await User.find().select('-password').sort({ createdAt: -1 }).lean();
        res.status(200).json({ success: true, data: userList });
    } catch (error) {
        logger.error('Admin get users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const ToggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.status(200).json({ success: true, message: `用户已${user.isActive ? '启用' : '封禁'}` });
    } catch (error) {
        logger.error('Admin toggle user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const GetAllRatings = async (req, res) => {
    try {
        const ratingList = await ratings.find().sort({ createdAt: -1 }).lean();
        res.status(200).json({ success: true, data: ratingList });
    } catch (error) {
        logger.error('Admin get ratings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const DeleteRating = async (req, res) => {
    try {
        const { id } = req.params;
        const rating = await ratings.findById(id);

        if (!rating) {
            return res.status(404).json({ success: false, message: '评价不存在' });
        }

        const teacher = await teachers.findById(rating.teacherId);
        if (teacher) {
            teacher.ratingCount = Math.max(0, teacher.ratingCount - 1);
            teacher.ratingSum = Math.max(0, teacher.ratingSum - rating.rating);
            await teacher.save();
        }

        await ratings.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: '评价已删除' });
    } catch (error) {
        logger.error('Admin delete rating error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    GetAllTeachers,
    CreateTeacher,
    ApproveTeacher,
    DeleteTeacher,
    GetAllUsers,
    ToggleUserStatus,
    GetAllRatings,
    DeleteRating
};
