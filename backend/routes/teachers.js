const express = require('express');
const router = express.Router();

const { GetTeachers, GetTeacherById, GetTeacherRatings, CreateTeacher } = require('../controllers/teacherController');
const { AuthAdmin, Auth } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validateObjectId');

router.get('/', GetTeachers);
router.get('/:id', validateObjectId('id'), GetTeacherById);
router.get('/:id/ratings', validateObjectId('id'), GetTeacherRatings);
router.post('/', Auth, AuthAdmin, CreateTeacher);

module.exports = router;
