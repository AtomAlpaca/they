const express = require('express');
const router = express.Router();

const { Auth } = require('../middleware/auth');

const {
    CreateSubmission,
    GetMySubmissions,
    GetPendingSubmissions,
    ApproveSubmission,
    RejectSubmission
} = require('../controllers/submissionController');

router.post('/', Auth, CreateSubmission);
router.get('/my', Auth, GetMySubmissions);

module.exports = router;
