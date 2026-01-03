import * as jose from "jose";

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "eduflow-secret-key-2024");
const ALG = "HS256";

export interface TokenPayload {
    id: string;
    role?: string;
    currentInstituteNumber?: string | number | null;
    instituteNumber?: string | number | null;
}

const generateJWTToken = async (payload: TokenPayload): Promise<string> => {
    const jwt = await new jose.SignJWT(payload as any)
        .setProtectedHeader({ alg: ALG })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(SECRET_KEY);

    return jwt;
};

export const verifyJwtToken = async (token: string): Promise<TokenPayload> => {
    const { payload } = await jose.jwtVerify(token, SECRET_KEY, {
        algorithms: [ALG],
    });
    return payload as unknown as TokenPayload;
};

export default generateJWTToken;
