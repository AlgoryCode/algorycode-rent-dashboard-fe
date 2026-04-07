import axios, { AxiosError } from "axios";
import { ApiError } from "@/lib/api/errors";

interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
  accessTokenExpiresAt?: number;
  userId?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  requiresTwoFactor?: boolean;
}

function toApiError(e: unknown, fallback: string): ApiError {
  const err = e as AxiosError<{ message?: string }>;
  const status = err.response?.status ?? 0;
  const message = err.response?.data?.message || err.message || fallback;
  return new ApiError(status, message, err.response?.data);
}

export const authService = {
  async login(params: { email: string; password: string }): Promise<AuthResponse> {
    try {
      const { data } = await axios.post<AuthResponse>("/api/auth/login", params, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      return data;
    } catch (e) {
      throw toApiError(e, "Giriş başarısız");
    }
  },
};
