const { User } = require('../models'); // changed: import from central models/index.js
const jwt = require('jsonwebtoken');
const tokenBlacklistModel = require('../models/tokenBlacklist.model');


async function authMiddleware(req, res, next) {
  
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if(!token) {
        return res.status(401).json({ message: 'Unauthorized access, token is missing' 

        });
    } 

    const isTokenBlacklisted = await tokenBlacklistModel.findOne({ where: { token } });

    if (isTokenBlacklisted) {
        return res.status(401).json({ message: 'Unauthorized access, token is blacklisted' });
    }

    try{
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId); // changed: findById -> findByPk, userID -> userId

if (!user) {
  return res.status(401).json({ message: 'User not found' }); 
}

req.user = user;
return next();

    }catch(err) {
        return res.status(401).json({ message: 'Unauthorized access, invalid token' });
    }
}

async function authsystemUserMiddleware(req, res, next) {

    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
 
    
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized access, token is missing' });
    }
    
    const isTokenBlacklisted = await tokenBlacklistModel.findOne({ where: { token } });

    if (isTokenBlacklisted) {
        return res.status(401).json({ message: 'Unauthorized access, token is blacklisted' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.scope('withSystemUser').findByPk(decoded.userId);

if (!user || !user.systemUser) {
  return res.status(403).json({ message: 'Forbidden: Access denied for non-system users' });
}
        req.user = user;
        return next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized access, invalid token' });
    }
}

module.exports = {authMiddleware, authsystemUserMiddleware};