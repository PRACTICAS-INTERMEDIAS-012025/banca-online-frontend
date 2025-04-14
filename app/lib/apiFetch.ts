import { $fetch, ofetch, type FetchOptions } from "ofetch";
import { createCookie } from "react-router";
import { getSession } from "~/session";

export function $api<T>(
  url: string,
  options?: FetchOptions,
  request?: Request,
) {
  return $fetch(url, {
    baseURL: import.meta.env.VITE_API_BASE_URL,
    ...options,
    async onRequest({ options }) {
      if (request) {
        const cookie = request.headers.get("cookie");
        const session = await getSession(cookie);
        const token = session.get("token")
        options.headers.set("Authorization", `Bearer ${token}`);
      }
    },
  });
}
