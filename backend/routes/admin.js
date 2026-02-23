const express = require('express');
const router = express.Router();

const { Auth } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validateObjectId');

const {
    GetAllTeachers,
    CreateTeacher,
    ApproveTeacher,
    DeleteTeacher,
    GetAllUsers,
    ToggleUserStatus,
    GetAllRatings,
    DeleteRating
} = require('../controllers/adminController');

const {
    GetPendingSubmissions,
    ApproveSubmission,
    RejectSubmission
} = require('../controllers/submissionController');

const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: '权限不足' });
    }
    next();
};

router.get('/teachers', Auth, adminMiddleware, GetAllTeachers);
router.post('/teachers', Auth, adminMiddleware, CreateTeacher);
router.post('/teachers/:id/approve', Auth, adminMiddleware, validateObjectId('id'), ApproveTeacher);
router.delete('/teachers/:id', Auth, adminMiddleware, validateObjectId('id'), DeleteTeacher);

router.get('/users', Auth, adminMiddleware, GetAllUsers);
router.post('/users/:id/toggle', Auth, adminMiddleware, validateObjectId('id'), ToggleUserStatus);

router.get('/ratings', Auth, adminMiddleware, GetAllRatings);
router.delete('/ratings/:id', Auth, adminMiddleware, validateObjectId('id'), DeleteRating);

router.get('/submissions', Auth, adminMiddleware, GetPendingSubmissions);
router.post('/submissions/:id/approve', Auth, adminMiddleware, validateObjectId('id'), ApproveSubmission);
router.post('/submissions/:id/reject', Auth, adminMiddleware, validateObjectId('id'), RejectSubmission);

module.exports = router;
