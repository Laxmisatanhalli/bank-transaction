const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const emailService = require('../services/email.service');
const { Op } = require('sequelize');
const tokenBlacklistModel = require('../models/blacklist.model'); 
const bcrypt = require('bcrypt');

/** 
 * - user register controller 
 * - POST /api/auth/register
 */

async function userRegisterController(req, res) {
  try {
    const { email, password, name, systemSecret } = req.body;

    const isExists = await User.findOne({ where: { email } });

    if (isExists) {
      return res.status(422).json({
        message: "User already exists",
        status: "failed"
      });
    }

    const isSystemUser = systemSecret && systemSecret === process.env.SYSTEM_USER_SECRET;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword,
      systemUser: isSystemUser
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.cookie('token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    });

    await emailService.sendRegistrationEmail(user.email, user.name);

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Something went wrong', status: 'failed' });
  }
}

/**
 * - user login controller
 * - POST /api/auth/login
 */
async function userLoginController(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.scope('withPassword').findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        message: "Email or Password is incorrect",
        status: "failed"
      });
    }

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      return res.status(404).json({
        message: "Email or Password is incorrect",
        status: "failed"
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.cookie('token', token, {
  httpOnly: true,   // JS on the frontend can't read this cookie (blocks XSS token theft)
  secure: true,      // only sent over HTTPS
  sameSite: 'strict' // blocks the cookie being sent on cross-site requests (CSRF protection)
});

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Something went wrong', status: 'failed' });
  }
}

/**
 * - user logout controller
 * - POST /api/auth/logout  
 * */
async function userLogoutController(req, res) {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(200).json({ message: 'User logged out successfully' });
    }

    await tokenBlacklistModel.create({ token });

    res.clearCookie('token');
    res.status(200).json({ message: 'User logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Something went wrong', status: 'failed' });
  }
}

module.exports = {
  userRegisterController,
  userLoginController,
  userLogoutController
};