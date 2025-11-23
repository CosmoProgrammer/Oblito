import bcrypt from "bcrypt";
import { z } from "zod";
import type { Request, Response } from 'express';
import crypto from 'crypto';

import db  from "../db/index.js";
import { eq } from "drizzle-orm";
import { users } from "../db/schema/users.js";
import { shops } from "../db/schema/shops.js";
import { warehouses } from "../db/schema/warehouses.js";

import { signUpSchema, loginSchema } from "../validation/auth-validation.js";
import { generateToken, setTokenCookie } from "../services/auth-service.js";
import { sendOTPEmail } from '../services/email-service.js';

export const handleGoogleCallback = async (req: any, res: any) => {
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
};

export const handleSignUp = async (req: any, res: any) => {
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


        const dbUser = await db.transaction(async (tx) => {
            const newUsers = await tx.insert(users).values({
                email,
                passwordHash,
                firstName,
                lastName: lastName || null,
                role: userRole || 'customer',
            }).returning();

            const newUser = newUsers[0];
            if (!newUser) {
                throw new Error("Failed to create user.");
            }

            if (newUser.role === 'retailer') {
                await tx.insert(shops).values({
                    ownerId: newUser.id,
                    name: `${newUser.firstName}'s Shop`,
                });
            } else if (newUser.role === 'wholesaler') {
                await tx.insert(warehouses).values({
                    ownerId: newUser.id,
                    name: `${newUser.firstName}'s Warehouse`,
                });
            }

            return newUser;

        });

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
};

export const handleLogin = async (req: any, res: any) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        console.log("Login attempt for email:", email);
        console.log("Password provided:", password );

        const dbUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!dbUser || !dbUser.passwordHash) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, dbUser.passwordHash);
        console.log("Password match result:", isMatch);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(dbUser);
        setTokenCookie(res, token);

        res.status(200).json({message: 'Login successful', user: { id: dbUser.id, email: dbUser.email, firstName: dbUser.firstName, lastName: dbUser.lastName, role: dbUser.role } });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error during login:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const handleGetUser = async (req: any, res: any) => {
    res.json({user: req.user });
};

export const handleLogout = async (req: any, res: any) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

export const requestOTP = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.email, email.toLowerCase()),
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update user with OTP
        await db.update(users)
            .set({
                otp: otp,
                otpExpiresAt: otpExpiresAt,
                otpAttempts: 0,
            })
            .where(eq(users.id, user.id));

        // Send OTP via email
        await sendOTPEmail(user.email, otp, user.firstName || 'User');

        return res.status(200).json({ 
            message: 'OTP sent successfully to your email',
            email: user.email 
        });
    } catch (error) {
        console.error('Error requesting OTP:', error);
        return res.status(500).json({ message: 'Failed to send OTP', error: (error as any).message });
    }
};

export const verifyOTP = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.email, email.toLowerCase()),
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if OTP has expired
        if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // Check OTP attempts (max 5)
        if ((user.otpAttempts || 0) >= 5) {
            return res.status(400).json({ message: 'Too many failed attempts. Please request a new OTP.' });
        }

        // Verify OTP
        if (user.otp !== otp) {
            await db.update(users)
                .set({ otpAttempts: (user.otpAttempts || 0) + 1 })
                .where(eq(users.id, user.id));
            
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Clear OTP fields
        await db.update(users)
            .set({
                otp: null,
                otpExpiresAt: null,
                otpAttempts: 0,
            })
            .where(eq(users.id, user.id));

        // Generate JWT token for the user using the same method as login
        const token = generateToken(user);

        // Use the same cookie name as the login route (from setTokenCookie)
        setTokenCookie(res, token);

        return res.status(200).json({ 
            message: 'OTP verified successfully',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            }
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return res.status(500).json({ message: 'Failed to verify OTP', error: (error as any).message });
    }
};
