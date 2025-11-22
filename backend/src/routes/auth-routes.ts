import { Router } from "express";
import passport from "passport";

import { protect } from "../middleware/auth-middleware.js";

import { handleGoogleCallback, handleSignUp, handleLogin, handleGetUser, handleLogout } from "../controllers/auth-controller.js";

const router = Router();

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login`, session: false }),
    handleGoogleCallback
);

router.post('/auth/signup', handleSignUp);

router.post('/auth/login',  handleLogin);

router.get('/auth/user', protect, handleGetUser);

router.post('/auth/logout', protect, handleLogout);

export default router;