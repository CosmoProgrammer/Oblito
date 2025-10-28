import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import 'dotenv/config';

import { protect } from "../middleware/auth-middleware.js";

const router = Router();

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login`, session: false }),
    (req, res) => {
        const user = req.user as { id: string; email: string; name: string; provider: string };
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '1h' }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 3600000, // 1 hour
        });

        res.redirect(`${process.env.CLIENT_URL}/home`);
    }
);

router.get('/auth/user', protect, (req, res) => {
    res.json({user: req.user });
});

export default router;