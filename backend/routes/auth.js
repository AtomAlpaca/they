const express = require('express');
const router = express.Router();

const { Register, Login, getProfile, UpdateProfile } = require('../controllers/authController');
const { Auth } = require('../middleware/auth');

router.post('/register', Register);

router.post('/login', Login);

router.get('/profile', Auth, getProfile);

router.put('/profile', Auth, UpdateProfile);

module.exports = router;