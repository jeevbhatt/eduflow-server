import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authRepository from "../repository/authRepository";

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

  generateTokens(payload: any) {
    const accessToken = jwt.sign(payload, this.jwtSecret, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, this.jwtRefreshSecret, { expiresIn: "7d" });
    return { accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await this.comparePasswords(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const tokens = this.generateTokens({ id: user.id, email: user.email, role: user.role });

    // Update last login
    await authRepository.updateLastLogin(user.id);

    return { user, ...tokens };
  }
}

export default new AuthService();
