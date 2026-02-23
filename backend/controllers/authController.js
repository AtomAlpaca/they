const { repo } = require('../models/user');
const Joi = require('joi')
const logger = require('../config/logger')


const Register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!email || email.length == 0) {
                return res.status(400).json({
                success: false,
                message: 'Email address is required'
            });
        }
        if (!username || username.length == 0) {
                return res.status(400).json({
                success: false,
                message: 'Username is required'
            });
        }
        if (!password || password.length == 0) {
                return res.status(400).json({
                success: false,
                message: 'Password is required'
            });
        }
        const emailSchema = Joi.object({
            email: Joi.string().email().required()
        })
        const emailRes = emailSchema.validate({"email" : email})
        if (emailRes.error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address'
            });
        }

        const usernameSchema = Joi.object({
            username: Joi.string().min(3).max(30).pattern(/^[a-zA-Z0-9]+$/).required()
        })
        const usernameRes = usernameSchema.validate({"username" : username})
        if (usernameRes.error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid username'
            });
        }


        const email_exists = await repo.findOne({
           email 
        });

        const name_exists = await repo.findOne({
            username
        })

        if (email.length != 0 && email_exists) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists.'
            });
        }
        if (username.length != 0 && name_exists) {
            return res.status(400).json({
                success: false,
                message: 'User with this username already exists.'
            });
        }

        const user = await repo.create({
            username,
            email,
            password
        })
        const { password: pwd, ...userData } = user.toObject();
    
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: userData
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
}
const Login = async (req, res) => {
    try {
        const { email, username, password } = req.body;

        // 检查是否提供了邮箱或用户名
        let user;
        if (email && email.length !== 0) {
            user = await repo.findOne({ email }).select('+password');
        } else if (username && username.length !== 0) {
            user = await repo.findOne({ username }).select('+password');
        } else {
            return res.status(401).json({
                success: false,
                message: 'Please input your username or email'
            });
        }
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'The user does not exist'
            });
        }

        const match = await user.comparePassword(password);

        if (!match) {
            return res.status(401).json({
                success: false,
                message: 'The password is wrong'
            });
        }

        if (!user.isActive) {
             return res.status(401).json({
                success: false,
                message: 'This user was banned by admin'
            });
        }

        const { SignJWT } = require('jose');

        const secret = process.env.JWT_SECRET;

        if (!secret || secret.length === 0) {
            logger.error('Login error: JWT secret key not found');
            return res.status(500).json({
                success: false,
                message: 'Server error during login'
            });
        }

        const jwt = await new SignJWT({ 
            userId: user._id.toString(),
            username: user.username,
            email: user.email,
            role: user.role
        })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('12h')
        .sign(new TextEncoder().encode(secret));
        res.status(200).json({
            success: true,
            message: 'Login successful',
            jwt : jwt,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                profile: user.profile
            }
        })
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }

}

const getProfile = async (req, res) => {
  try {
    const user = await repo.findById(req.user.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
      }
    });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving profile'
    });
  }
};

const UpdateProfile = async (req, res) => {
  try {
    const { email, password, profile } = req.body;
    const userId = req.user.userId;

    const user = await repo.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (email && email !== user.email) {
      const emailExists = await repo.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      user.email = email;
    }

    if (password) {
      if (password.length < 6 || password.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Password must be between 6 and 100 characters'
        });
      }
      user.password = password;
    }

    if (profile) {
      user.profile = user.profile || {};
      if (profile.firstName !== undefined) {
        if (typeof profile.firstName !== 'string' || profile.firstName.length > 50) {
          return res.status(400).json({
            success: false,
            message: 'Invalid firstName'
          });
        }
        user.profile.firstName = profile.firstName.trim();
      }
      if (profile.lastName !== undefined) {
        if (typeof profile.lastName !== 'string' || profile.lastName.length > 50) {
          return res.status(400).json({
            success: false,
            message: 'Invalid lastName'
          });
        }
        user.profile.lastName = profile.lastName.trim();
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
      }
    });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

module.exports = {
    Register,
    Login,
    getProfile,
    UpdateProfile
};