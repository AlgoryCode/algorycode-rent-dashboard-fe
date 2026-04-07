import axios from "axios";

import { getAuthUpstreamUrl } from "@/lib/config";

export type BasicAuthLoginInput = {
  email: string;
  password: string;
};

/**
 * AuthService `basicauth/login` — gateway üzerinden diğer istemcilerle aynı uç ve gövde biçimi.
 * Kullanıcı adı alanı e-posta ile doldurulduğu için `username` ve `email` aynı değerle gönderilir.
 */
export async function postAuthServiceBasicLogin(input: BasicAuthLoginInput) {
  const email = input.email.trim();
  const url = `${getAuthUpstreamUrl()}/basicauth/login`;
  const body = {
    username: email,
    email,
    password: input.password,
  };

  return axios.post<Record<string, unknown>>(url, body, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    timeout: 30_000,
    validateStatus: () => true,
  });
}
