const jwt = require('jsonwebtoken');
const userService = require('../services/userService');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-very-long-random-string');
    const user = await userService.getById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    req.user = {
      ...decoded,
      id: user.id,
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      userType: user.userType,
      organizationId: user.organizationId,
      storeId: user.storeId
    };
    req.userObj = user;

    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = auth;
