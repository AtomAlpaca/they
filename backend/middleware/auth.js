const { jwtVerify } = require('jose');
const logger = require('../config/logger');

const Auth = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token, authorization denied'
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length === 0) {
      logger.error('Auth error: JWT secret key not found');
      return res.status(500).json({
          success : false,
          message : 'Server error during authentication'
      });
  }

  jwtVerify(token, new TextEncoder().encode(secret))
    .then(verified => {
      req.user = {
        userId : verified.payload.userId,
        username : verified.payload.username,
        email : verified.payload.email,
        role : verified.payload.role
      };
      next();
    })
    .catch(error => {
      logger.error(`Token verification failed: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: 'Token is invalid, please try to login again'
      });
    });
};

const AuthAdmin = (req, res, next) => {
  let { role } = req.user
  if (!role || role != "admin") {
      return res.status(403).json({
      success: false,
      message: 'The user is not an admin'
    });
  }
  next()
}

module.exports = { Auth, AuthAdmin };
