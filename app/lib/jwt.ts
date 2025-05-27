import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import jsonwebtoken, { type JwtPayload, type Algorithm } from "jsonwebtoken";
import invariant from "tiny-invariant";
import { v4 as uuidv4 } from "uuid";
import { drizzleClient } from "~/db.server";
import { getUserByEmail } from "~/models/user.server";
import { type User } from "~/schema";
import { refreshToken, tokenRevocation } from "~/schema/refreshToken";

const { sign, verify } = jsonwebtoken;

const {
  JWT_ALGORITHM,
  JWT_ISSUER,
  JWT_VALIDITY_MS,
  JWT_SECRET,
  REFRESH_TOKEN_ALGORITHM,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_VALIDITY_MS,
} = process.env;

const jwtSignOptions = {
  algorithm: JWT_ALGORITHM as Algorithm,
  issuer: JWT_ISSUER,
  expiresIn: Math.round(Number(JWT_VALIDITY_MS) / 1000),
};

const jwtVerifyOptions = {
  algorithm: [JWT_ALGORITHM as Algorithm],
  issuer: JWT_ISSUER,
};

/**
 *
 * @param user
 * @returns
 */
export const createToken = (
  user: User,
): Promise<{
  token: string;
  refreshToken: string;
}> => {
  invariant(typeof JWT_ALGORITHM === "string");
  invariant(typeof JWT_ISSUER === "string");
  invariant(typeof JWT_VALIDITY_MS === "string");
  invariant(typeof JWT_SECRET === "string");

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
        const refreshToken = hashJwt(token);
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

export const revokeToken = async (user: User, jwtString: string) => {
  invariant(typeof JWT_ALGORITHM === "string");
  invariant(typeof JWT_ISSUER === "string");
  invariant(typeof JWT_SECRET === "string");

  const hash = hashJwt(jwtString);
  await deleteRefreshToken(hash);
  const jwt = await decodeJwtString(jwtString, JWT_SECRET, jwtVerifyOptions);

  if (jwt.jti)
    await drizzleClient.insert(tokenRevocation).values({
      hash,
      token: jwt,
      expiresAt: jwt.exp === undefined ? new Date() : new Date(jwt.exp),
    });
};

/**
 *
 * @param r
 * @returns
 */
export const getUserFromJwt = async (
  r: Request,
): Promise<User | "no_token" | "invalid_token_type" | "verification_error"> => {
  invariant(typeof JWT_ALGORITHM === "string");
  invariant(typeof JWT_ISSUER === "string");
  invariant(typeof JWT_SECRET === "string");

  // check if Authorization header is present
  const rawAuthorizationHeader = r.headers.get("authorization");
  if (!rawAuthorizationHeader) return "no_token";

  const [bearer, jwtString] = rawAuthorizationHeader.split(" ");
  if (bearer !== "Bearer") return "invalid_token_type";

  let decodedJwt: JwtPayload | undefined = undefined;
  try {
    decodedJwt = await decodeJwtString(jwtString, JWT_SECRET, {
      ...jwtVerifyOptions,
      ignoreExpiration: r.url === "/users/refresh-auth" ? true : false, // ignore expiration for refresh endpoint
    });
  } catch (err: any) {
    if (typeof err === "string") return err as "verification_error";
  }

  invariant(decodedJwt !== undefined);
  invariant(decodedJwt.sub !== undefined);
  const user = await getUserByEmail(decodedJwt.sub);
  if (!user)
    throw new Error("User was not found despite a verified jwt provided");
  return user;
};

const decodeJwtString = (
  jwtString: string,
  jwtSecret: jsonwebtoken.Secret,
  options: jsonwebtoken.VerifyOptions & { complete?: false },
): Promise<JwtPayload> => {
  return new Promise((resolve, reject) => {
    verify(jwtString, jwtSecret, options, async (err, decodedJwt) => {
      if (err) reject("verification_error");
      if (decodedJwt === undefined) {
        reject("verification_error");
        return;
      }

      // Our tokens are signed with an object, therefore tokens that
      // verify and decode to a string cannot be valid
      if (typeof decodedJwt === "string") {
        reject("verification_error");
        return;
      }

      // We sign our jwt with the user email as the subject, so if there is
      // no subject, the jwt cannot be valid as well.
      if (decodedJwt.sub === undefined) {
        reject("verification_error");
        return;
      }

      // check if the token is blacklisted by performing a hmac digest
      // on the string representation of the jwt.
      // also checks the existence of the jti claim
      if (await isTokenRevoked(decodedJwt, jwtString)) {
        reject("verification_error");
        return;
      }

      resolve(decodedJwt);
      return;
    });
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

const deleteRefreshToken = async (tokenHash: string) => {
  await drizzleClient
    .delete(refreshToken)
    .where(eq(refreshToken.token, tokenHash));
};

const isTokenRevoked = async (token: JwtPayload, tokenString: string) => {
  if (!token.jti) {
    // token has no id.. -> shouldn't be accepted
    return true;
  }

  const hash = hashJwt(tokenString);

  const revokedToken = await drizzleClient
    .select()
    .from(tokenRevocation)
    .where(eq(tokenRevocation.hash, hash));

  if (revokedToken.length > 0) return true;
  return false;
};

const hashJwt = (jwt: string) => {
  invariant(typeof REFRESH_TOKEN_ALGORITHM === "string");
  invariant(typeof REFRESH_TOKEN_SECRET === "string");

  return createHmac(REFRESH_TOKEN_ALGORITHM, REFRESH_TOKEN_SECRET)
    .update(jwt)
    .digest("base64");
};
