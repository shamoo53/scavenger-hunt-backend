export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  access_token?: string;
  refresh_token?: string;
  user: {
    id: string;
    email: string;
    username?: string;
    role: string;
    walletAddress?: string;
    emailVerified?: boolean;
  };
}
