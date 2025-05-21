import { createHmac } from "node:crypto";
import jsonwebtoken, { type Algorithm } from "jsonwebtoken";
import invariant from "tiny-invariant";
import { v4 as uuidv4 } from "uuid";
import { drizzleClient } from "~/db.server";
import { type User } from "~/schema";
import { refreshToken } from "~/schema/refreshToken";

const { sign } = jsonwebtoken;

const {
  JWT_ALGORITHM,
  JWT_ISSUER,
  JWT_VALIDITIY_MS,
  JWT_SECRET,
  REFRESH_TOKEN_ALGORITHM,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_VALIDITY_MS,
} = process.env;

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
  invariant(typeof JWT_ALGORITHM === "string");
  invariant(typeof JWT_ISSUER === "string");
  invariant(typeof JWT_VALIDITIY_MS === "string");
  invariant(typeof JWT_SECRET === "string");
  invariant(typeof REFRESH_TOKEN_ALGORITHM === "string");
  invariant(typeof REFRESH_TOKEN_SECRET === "string");
  invariant(typeof REFRESH_TOKEN_VALIDITY_MS === "string");

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
