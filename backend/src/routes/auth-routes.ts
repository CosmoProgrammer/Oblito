import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

import db  from "../db/index.js";
import { eq } from "drizzle-orm";
import { users } from "../db/schema.js";

import { protect } from "../middleware/auth-middleware.js";

const router = Router();

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login`, session: false }),
    async (req, res) => {
        try{
            const user = req.user as { id: string; email: string; name: string; provider: string };
            
            let dbUser = await db.query.users.findFirst({
                where: eq(users.googleId, user.id)
            });

            if (!dbUser) {
                const [firstName, ...lastNameParts] = user.name.split(' ');
                const lastName = lastNameParts.join(' ');
                const newUser = await db.insert(users).values({
                    googleId: user.id,
                    email: user.email,
                    firstName: firstName,
                    lastName: lastName  || null,
                    role: 'customer',
                }).returning();
                dbUser = newUser[0];
                if (!dbUser) {
                    return res.redirect(`${process.env.CLIENT_URL}/login`);
                }
            }

            const token = jwt.sign(
                { id: dbUser.id, email: dbUser.email },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '1h' }
            );

            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 3600000, 
            });

            res.redirect(`${process.env.CLIENT_URL}/home`);
        } catch (e) {
            console.error('Error during Google OAuth callback:', e);
            res.redirect(`${process.env.CLIENT_URL}/login`);
        }
    }
);

router.get('/auth/user', protect, (req, res) => {
    res.json({user: req.user });
});

export default router;