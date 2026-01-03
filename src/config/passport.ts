/**
 * Passport Configuration (Optional)
 *
 * This file provides web-based OAuth flow using Passport.js.
 * The packages 'passport' and 'passport-google-oauth20' are optional dependencies.
 *
 * Token-based OAuth (for SPA/mobile) is handled in oauthController.ts without Passport.
 *
 * To enable Passport-based OAuth, install:
 *   npm install passport passport-google-oauth20 @types/passport @types/passport-google-oauth20
 */

// Note: Passport is not currently used - the app uses token-based OAuth instead.
// The oauthController.ts handles Google/Microsoft token verification directly.
// This file is kept for future reference if web-based OAuth flow is needed.

// If you need to enable Passport, uncomment the following and install the packages:
/*
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import User from '../database/models/userModel';

const configurePassport = () => {
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
            scope: ['profile', 'email']
        }, async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
            try {
                let user = await User.findOne({ where: { googleId: profile.id } });

                if (!user) {
                    const email = profile.emails?.[0]?.value;
                    if (email) {
                        user = await User.findOne({ where: { email } });
                        if (user) {
                            await User.update({ googleId: profile.id }, { where: { id: user.id } });
                        }
                    }
                }

                if (!user) {
                    user = await User.create({
                        googleId: profile.id,
                        email: profile.emails?.[0]?.value || `${profile.id}@google.oauth`,
                        firstName: profile.name?.givenName || 'Google',
                        lastName: profile.name?.familyName || 'User',
                        password: 'OAUTH_USER_NO_PASSWORD',
                        profileImage: profile.photos?.[0]?.value,
                        role: 'student'
                    });
                }

                return done(null, user);
            } catch (error) {
                return done(error as Error, undefined);
            }
        }));
    }

    passport.serializeUser((user: any, done: (err: any, id?: string) => void) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done: (err: any, user?: any) => void) => {
        try {
            const user = await User.findByPk(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};

export default configurePassport;
export { passport };
*/

// Placeholder exports to prevent import errors
const configurePassport = () => {
    console.log('Passport not configured - using token-based OAuth instead.');
};

export default configurePassport;
