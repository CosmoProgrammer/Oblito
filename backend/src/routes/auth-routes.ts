import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";

import db  from "../db/index.js";
import { eq } from "drizzle-orm";
import { users } from "../db/schema.js";

import { protect } from "../middleware/auth-middleware.js";

const router = Router();

const signUpSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().optional(),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    userRole: z.enum(['customer', 'retailer', 'wholesaler']).optional(),
});

const loginSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

const generateToken = (dbUser: typeof users.$inferSelect) => {
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

const setTokenCookie = (res: any, token: string) => {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600000,
    });
};

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login`, session: false }),
    async (req, res) => {
        try{
            const user = req.user as { id: string; email: string; name: string; provider: string, profilePictureUrl: string | null };
            
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
                    profilePictureUrl: user.profilePictureUrl,
                }).returning();
                dbUser = newUser[0];
                if (!dbUser) {
                    return res.redirect(`${process.env.CLIENT_URL}/login`);
                }
            }

            const token = generateToken(dbUser);

            setTokenCookie(res, token);

            res.redirect(`${process.env.CLIENT_URL}/home`);
        } catch (e) {
            console.error('Error during Google OAuth callback:', e);
            res.redirect(`${process.env.CLIENT_URL}/login`);
        }
    }
);

router.post('/auth/signup', async (req, res) => {
    try {
        const {email, password, firstName, lastName, userRole} = signUpSchema.parse(req.body);

        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (existingUser) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUsers = await db.insert(users).values({
            email,
            passwordHash,
            firstName,
            lastName: lastName || null,
            role: userRole || 'customer',
        }).returning();
        const dbUser = newUsers[0];
        if (!dbUser) {
            return res.status(500).json({ message: 'Internal server error' });
        }

        const token = generateToken(dbUser);
        setTokenCookie(res, token);

        res.status(201).json({ message: 'User created successfully' });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error during signup:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/auth/login',  async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const dbUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!dbUser || !dbUser.passwordHash) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, dbUser.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(dbUser);
        setTokenCookie(res, token);

        res.status(200).json({message: 'Login successful'});
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error during login:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/auth/user', protect, (req, res) => {
    res.json({user: req.user });
});

export default router;