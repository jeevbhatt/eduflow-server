import { Request, Response } from "express";
import User from "../../../database/models/userModel";
import generateJWTToken from "../../../services/secureTokenService";

/**
 * OAuth Controller
 * Handles token-based OAuth authentication for SPA/mobile clients.
 *
 * For Google: Frontend gets ID token from Google OAuth, sends to /google/token
 * For Microsoft: Frontend gets access token from Microsoft OAuth, sends to /microsoft/token
 */
class OAuthController {
    // Token-based OAuth for mobile/SPA (Google)
    public static googleTokenAuth = async (req: Request, res: Response) => {
        try {
            const { idToken, accessToken } = req.body;

            if (!idToken && !accessToken) {
                return res.status(400).json({ message: "OAuth token is required" });
            }

            // Verify token with Google
            const tokenToVerify = idToken || accessToken;
            const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${tokenToVerify}`);
            const payload = await response.json();

            if (payload.error) {
                // Try as access token
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: { 'Authorization': `Bearer ${accessToken || idToken}` }
                });

                if (!userInfoRes.ok) {
                    return res.status(401).json({ message: "Invalid OAuth token" });
                }

                const userInfo = await userInfoRes.json();
                return await OAuthController.handleGoogleUser(userInfo, res);
            }

            const { sub: googleId, email, given_name, family_name, picture } = payload;
            return await OAuthController.handleGoogleUser({
                id: googleId,
                email,
                given_name,
                family_name,
                picture
            }, res);
        } catch (error: any) {
            console.error('Google token auth error:', error);
            res.status(500).json({ message: "OAuth authentication failed", error: error.message });
        }
    };

    private static handleGoogleUser = async (profile: any, res: Response) => {
        const { id: googleId, email, given_name, family_name, picture } = profile;

        // Find or create user
        let user = await User.findOne({ where: { googleId } });

        if (!user && email) {
            user = await User.findOne({ where: { email } });
            if (user) {
                await User.update({ googleId }, { where: { id: user.id } });
            }
        }

        if (!user) {
            user = await User.create({
                googleId,
                email: email || `${googleId}@google.oauth`,
                firstName: given_name || 'Google',
                lastName: family_name || 'User',
                password: 'OAUTH_USER_NO_PASSWORD',
                profileImage: picture,
                role: 'student'
            });
        }

        // Generate JWT
        const token = await generateJWTToken({
            id: user.id,
            role: user.role,
            currentInstituteNumber: user.currentInstituteNumber
        });

        res.status(200).json({
            message: "OAuth login successful",
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    profileImage: user.profileImage
                }
            }
        });
    };

    // Token-based OAuth for Microsoft
    public static microsoftTokenAuth = async (req: Request, res: Response) => {
        try {
            const { accessToken } = req.body;

            if (!accessToken) {
                return res.status(400).json({ message: "Microsoft access token is required" });
            }

            // Get user info from Microsoft Graph API
            const response = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                return res.status(401).json({ message: "Invalid Microsoft access token" });
            }

            const profile = await response.json();
            const { id: microsoftId, mail, givenName, surname, displayName } = profile;

            // Find or create user
            let user = await User.findOne({ where: { microsoftId } });

            if (!user && mail) {
                user = await User.findOne({ where: { email: mail } });
                if (user) {
                    await User.update({ microsoftId }, { where: { id: user.id } });
                }
            }

            if (!user) {
                user = await User.create({
                    microsoftId,
                    email: mail || `${microsoftId}@microsoft.oauth`,
                    firstName: givenName || displayName?.split(' ')[0] || 'Microsoft',
                    lastName: surname || displayName?.split(' ').slice(1).join(' ') || 'User',
                    password: 'OAUTH_USER_NO_PASSWORD',
                    role: 'student'
                });
            }

            // Generate JWT
            const token = await generateJWTToken({
                id: user.id,
                role: user.role,
                currentInstituteNumber: user.currentInstituteNumber
            });

            res.status(200).json({
                message: "Microsoft OAuth login successful",
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role
                    }
                }
            });
        } catch (error: any) {
            console.error('Microsoft token auth error:', error);
            res.status(500).json({ message: "Microsoft OAuth failed", error: error.message });
        }
    };
}

export default OAuthController;
