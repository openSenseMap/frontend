import { createHmac } from "node:crypto";
import { type Algorithm, sign } from "jsonwebtoken";
import invariant from "tiny-invariant";
import { v4 as uuidv4 } from "uuid";
import { type User } from "~/schema";
import { drizzleClient } from "~/db.server";
import { refreshToken } from "~/schema/refreshToken";

const JWT_ALGORITHM = process.env.JWT_ALGORITHM;
const JWT_ISSUER = process.env.JWT_ISSUER;
const JWT_VALIDITIY_MS = process.env.JWT_VALIDITY_MS;
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_ALGORITHM = process.env.REFRESH_TOKEN_ALGORITHM;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const REFRESH_TOKEN_VALIDITY_MS = process.env.REFRESH_TOKEN_VALIDITY_MS;

invariant(JWT_ALGORITHM !== undefined);
invariant(JWT_ISSUER !== undefined);
invariant(JWT_VALIDITIY_MS !== undefined);
invariant(JWT_SECRET !== undefined);
invariant(REFRESH_TOKEN_ALGORITHM !== undefined);
invariant(REFRESH_TOKEN_SECRET !== undefined);
invariant(REFRESH_TOKEN_VALIDITY_MS !== undefined);

const jwtSignOptions = {
  algorithm: JWT_ALGORITHM as Algorithm,
  issuer: JWT_ISSUER,
  expiresIn: Math.round(Number(JWT_VALIDITIY_MS) / 1000),
};

export const createToken = (
  user: User,
): Promise<{
  token: string;
  refreshToken: string;
}> => {
  const payload = { role: user.role };
  const signOptions = Object.assign(
    { subject: user.email, jwtid: uuidv4() },
    jwtSignOptions,
  );

  return new Promise(function (resolve, reject) {
    sign(
      payload,
      JWT_SECRET,
      signOptions,
      async (err: Error | null, token: string | undefined) => {
        if (err) return reject(err);
        if (typeof token === "undefined")
          return reject("Generated token was undefined and thus not valid");

        // JWT generation was successful
        // we now create the refreshToken.
        // and set the refreshTokenExpires to 1 week
        // it is a HMAC of the jwt string
        const refreshToken = createHmac(
          REFRESH_TOKEN_ALGORITHM,
          REFRESH_TOKEN_SECRET,
        )
          .update(token)
          .digest("base64");
        const refreshTokenExpiresAt: Date = new Date(
          Date.now() + Number(REFRESH_TOKEN_VALIDITY_MS),
        );
        try {
          await addRefreshToken(user.id, refreshToken, refreshTokenExpiresAt);
          return resolve({ token, refreshToken });
        } catch (err) {
          return reject(err);
        }
      },
    );
  });
};

const addRefreshToken = async (
  userId: string,
  token: string,
  expiresAt: Date,
) => {
  await drizzleClient.insert(refreshToken).values({
    userId,
    token,
    expiresAt,
  });
};
