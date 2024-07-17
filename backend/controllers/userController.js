const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Setup email transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Use your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Function to send an email for account activation
async function sendActivationEmail(user, req) {
  const activationUrl = `${req.protocol}://${req.get('host')}/api/users/activate/${user.activationToken}`;
  const mailOptions = {
    to: user.email,
    from: process.env.EMAIL_USER,
    subject: 'Account Activation',
    text: `Please activate your account by clicking the following link: ${activationUrl}`
  };

  await transporter.sendMail(mailOptions);
}

// Function to send an email for password reset
async function sendPasswordResetEmail(user, req) {
  const resetUrl = `${req.protocol}://${req.get('host')}/api/users/reset-password/${user.resetPasswordToken}`;
  const mailOptions = {
    to: user.email,
    from: process.env.EMAIL_USER,
    subject: 'Password Reset',
    text: `You are receiving this because you (or someone else) have requested the reset of the password for your account. Please click on the following link, or paste this into your browser to complete the process: ${resetUrl}`
  };

  await transporter.sendMail(mailOptions);
}

const userController = {
  register: async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      user = new User({
        firstName,
        lastName,
        email,
        password: await bcrypt.hash(password, 10),
        active: false,
        activationToken: crypto.randomBytes(20).toString('hex')
      });

      await user.save();
      await sendActivationEmail(user, req);

      res.status(200).json({ msg: 'Activation email sent' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  activateAccount: async (req, res) => {
    try {
      const user = await User.findOne({ activationToken: req.params.token });

      if (!user) {
        return res.status(400).json({ msg: 'Invalid token' });
      }

      user.active = true;
      user.activationToken = undefined;
      await user.save();

      res.status(200).json({ msg: 'Account activated successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user || !user.active) {
        return res.status(400).json({ msg: 'Invalid credentials or account not activated' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      const payload = { user: { id: user.id } };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(400).json({ msg: 'User not found' });
      }

      user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      await sendPasswordResetEmail(user, req);

      res.status(200).json({ msg: 'Password reset email sent' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  },

  resetPassword: async (req, res) => {
    try {
      const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
      if (!user) {
        return res.status(400).json({ msg: 'Invalid or expired token' });
      }

      user.password = await bcrypt.hash(req.body.password, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(200).json({ msg: 'Password reset successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
};

module.exports = userController;
