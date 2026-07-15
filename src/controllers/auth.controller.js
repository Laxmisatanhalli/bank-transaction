const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const emailService = require('../services/email.service');

/** 
 * - user register controller 
 * - POST /api/auth/register
 */
async function userRegisterController(req, res) {
  try {
    const { email, password, name } = req.body;

    const isExists = await User.findOne({ where: { email } });

    if (isExists) {
      return res.status(422).json({
        message: "User already exists",
        status: "failed"
      });
    }

    const user = await User.create({ name, email, password });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.cookie('token', token);

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

    res.cookie('token', token);

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

module.exports = {
  userRegisterController,
  userLoginController
};