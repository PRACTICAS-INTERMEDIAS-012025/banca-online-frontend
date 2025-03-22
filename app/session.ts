import { createCookieSessionStorage, redirect } from "react-router";
import type { LoginResponse } from "./lib/types/auth";

type SessionData = {
  token: string;
  credentials: LoginResponse;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    cookie: {
      name: "__session",

      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 1000 * 60 * 60,
      // secrets: [process.env.SESSION_SECRET as string],
      secrets: ["TestSecret123"],
      secure: true,
    },
  });

export { getSession, commitSession, destroySession };


export async function requireUserSession(request: Request) {
  // get the session
  const cookie = request.headers.get("cookie");
  const session = await getSession(cookie);

  // check if session has the credentials
  if (!session.has("credentials")) {

    // if there is no user session, redirect to login
    throw redirect("/login");
  }

  return session;
}

export async function getCurrentUserData(request: Request) {
  const cookie = request.headers.get("cookie");
  const session = await getSession(cookie);

  if (!session.has("credentials")) {
    return null;
  }

  return session.get("credentials");
}
