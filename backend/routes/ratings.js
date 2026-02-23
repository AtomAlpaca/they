const express = require('express');
const router = express.Router();

const { Rate, GetMyRatings } = require('../controllers/ratingController');
const { Auth } = require('../middleware/auth');

router.post('/', Auth, Rate);
router.get('/my', Auth, GetMyRatings);

module.exports = router;
