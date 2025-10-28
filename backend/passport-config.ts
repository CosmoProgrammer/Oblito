import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import 'dotenv/config';

console.log('Initializing passport strategies');

try {
    passport.use(
        new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            console.log('Google profile:', profile);
            const user = {
                id: profile.id,
                email: profile.emails?.[0]?.value,
                name: profile.displayName,
                provider: 'google',
            };
            return done(null, user);
        })
    );
} catch (err) {
    console.error('Failed to initialize GoogleStrategy:', err);
}