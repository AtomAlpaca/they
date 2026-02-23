const { submissions } = require('../models/submission');
const { teachers } = require('../models/teacher');
const logger = require('../config/logger');

const CreateSubmission = async (req, res) => {
    try {
        const { name, description } = req.body;
        const { userId } = req.user;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '教师姓名必填'
            });
        }

        const existingTeacher = await teachers.findOne({ name: name.trim() });
        if (existingTeacher) {
            return res.status(400).json({
                success: false,
                message: '该教师已在系统中'
            });
        }

        const submission = await submissions.create({
            name: name.trim(),
            description: description || '',
            submittedBy: userId,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: '投稿成功，等待审核',
            data: submission
        });
    } catch (error) {
        logger.error('Create submission error:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

const GetMySubmissions = async (req, res) => {
    try {
        const { userId } = req.user;

        const submissionList = await submissions.find({ submittedBy: userId })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: submissionList
        });
    } catch (error) {
        logger.error('Get my submissions error:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

const GetPendingSubmissions = async (req, res) => {
    try {
        const submissionList = await submissions.find({ status: 'pending' })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: submissionList
        });
    } catch (error) {
        logger.error('Get pending submissions error:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

const ApproveSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNote } = req.body;

        const submission = await submissions.findById(id);
        if (!submission) {
            return res.status(404).json({
                success: false,
                message: '投稿不存在'
            });
        }

        if (submission.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: '该投稿已处理'
            });
        }

        const teacher = await teachers.create({
            name: submission.name,
            description: submission.description,
            isActive: true,
            ratingCount: 0,
            ratingSum: 0
        });

        submission.status = 'approved';
        submission.adminNote = adminNote || '审核通过';
        submission.processedAt = new Date();
        await submission.save();

        res.status(200).json({
            success: true,
            message: '投稿已通过，教师已添加'
        });
    } catch (error) {
        logger.error('Approve submission error:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

const RejectSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNote } = req.body;

        const submission = await submissions.findById(id);
        if (!submission) {
            return res.status(404).json({
                success: false,
                message: '投稿不存在'
            });
        }

        if (submission.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: '该投稿已处理'
            });
        }

        submission.status = 'rejected';
        submission.adminNote = adminNote || '审核拒绝';
        submission.processedAt = new Date();
        await submission.save();

        res.status(200).json({
            success: true,
            message: '投稿已拒绝'
        });
    } catch (error) {
        logger.error('Reject submission error:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
};

module.exports = {
    CreateSubmission,
    GetMySubmissions,
    GetPendingSubmissions,
    ApproveSubmission,
    RejectSubmission
};
