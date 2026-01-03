import bcrypt from "bcrypt";
import * as jose from "jose";
import authRepo from "../repository/auth.repo";

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || "your-jwt-secret";
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || "your-refresh-secret";
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async generateTokens(payload: any) {
    const accessToken = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("15m")
      .sign(new TextEncoder().encode(this.jwtSecret));

    const refreshToken = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(this.jwtRefreshSecret));

    return { accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    const user = await authRepo.findByEmail(email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await this.comparePasswords(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const tokens = await this.generateTokens({ id: user.id, email: user.email, role: user.role });

    // Update last login
    await authRepo.updateLastLogin(user.id);

    return { user, ...tokens };
  }
}

export default new AuthService();
