import Elysia from "elysia";
import { auth } from "../../auth";

export const betterAuthPlugin = new Elysia({ name: "better-auth" })
  .all("/auth/*", ({ request }) => auth.handler(request))
  .macro({
    auth: (isAuth: boolean) => ({
      beforeHandle: async ({ set, headers }) => {
        if (!isAuth) return;

        try {
          const headersObj = Object.fromEntries(
            Object.entries(headers).map(([k, v]) => [k, v as string])
          );

          const authHeader = headers.authorization;
          if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);

            headersObj.cookie = `better-auth.session_token=${token}`;
          }

          const session = await auth.api.getSession({
            headers: headersObj,
          });

          if (!session) {
            set.status = 401;
            return { message: "Unauthorized" };
          }

          return session;
        } catch (error) {
          console.error("Auth error:", error);
          set.status = 401;
          return { message: "Unauthorized" };
        }
      },
    }),
  });
