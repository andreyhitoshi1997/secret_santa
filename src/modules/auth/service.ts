import { status } from "elysia";

import type { AuthModel } from "./model";

export abstract class Auth {
  static async signIn({ username, password }: AuthModel.signInBody) {
    const user = await sql`
			SELECT password
			FROM users
			WHERE username = ${username}
			LIMIT 1`;

    if (await Bun.password.verify(password, user.password))
      // You can throw an HTTP error directly
      throw status(
        400,
        "Invalid username or password" satisfies AuthModel.signInInvalid
      );

    return {
      username,
      token: await generateAndSaveTokenToDB(user.id),
    };
  }
}
