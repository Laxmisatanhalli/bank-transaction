const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');



async function authMiddleware(req, res, next) {
  
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if(!token) {
        return res.status(401).json({ message: 'Unauthorized access, token is missing' 

        });
    } 

    try{
      // auth.middleware.js
const decoded = jwt.verify(token, process.env.JWT_SECRET);
const user = await userModel.findById(decoded.userID); // ✅ capital ID to match

if (!user) {
  return res.status(401).json({ message: 'User not found' }); 
}

req.user = user;
return next();

    }catch(err) {
        return res.status(401).json({ message: 'Unauthorized access, invalid token' });
    }
}

module.exports = {authMiddleware};