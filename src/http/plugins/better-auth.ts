import Elysia from "elysia";
import { auth } from "../../auth";

export const betterAuthPlugin = new Elysia({ name: "better-auth" })
  .all("/auth/*", ({ request }) => auth.handler(request))
  .macro({
    auth: (isAuth: boolean) => ({
      beforeHandle: async ({ set, headers }) => {
        if (!isAuth) return;

        const session = await auth.api.getSession({
          headers: Object.fromEntries(
            Object.entries(headers).map(([k, v]) => [k, v as string])
          ),
        });

        if (!session) {
          set.status = 401;
          return { message: "Unauthorized" };
        }

        return session;
      },
    }),
  });

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>;
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema());

export const OpenAPI = {
  getPaths: (prefix = "/auth") =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null);

      for (const path of Object.keys(paths)) {
        const key = prefix + path;
        reference[key] = paths[path];

        for (const method of Object.keys(paths[path])) {
          const operation = (reference[key] as any)[method];

          operation.tags = ["Better Auth"];
        }
      }

      return reference;
    }) as Promise<any>,
  components: getSchema().then(({ components }) => components) as Promise<any>,
} as const;
