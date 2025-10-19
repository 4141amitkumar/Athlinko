// middleware/authMiddleware.js

const { admin } = require('../db'); // Assuming your firebase admin init is in db.js

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send('Unauthorized: No token provided');
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken; // User ki details ko request object mein add kar do
        next(); // Agle step pe jao
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(403).send('Unauthorized: Invalid token');
    }
};

module.exports = authMiddleware;