import jwt from "jsonwebtoken";
import 'dotenv/config';

export const protect = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

export const optionalAuth = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) {
        return next(); // No token, proceed without user
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        req.user = decoded; // Valid token, attach user
        next();
    } catch (error) {
        next(); // Invalid token, proceed without user
    }
};