import jwt from "jsonwebtoken";
import { users } from "../db/schema.js";

export const generateToken = (dbUser: typeof users.$inferSelect) => {
    return jwt.sign(
        { 
            id: dbUser.id, 
            email: dbUser.email, 
            profilePictureUrl: dbUser.profilePictureUrl, 
            firstName: dbUser.firstName, 
            lastName: dbUser.lastName, 
            role: dbUser.role 
        },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '1h' }
    );
};

export const setTokenCookie = (res: any, token: string) => {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600000,
    });
};