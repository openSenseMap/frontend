import { sign } from "jsonwebtoken";
import invariant from "tiny-invariant";
import { v4 as uuidv4 } from "uuid";
import { type User } from "~/schema";

const JWT_ALGORITHM = process.env.JWT_ALGORITHM;
const JWT_ISSUER = process.env.JWT_ISSUER;
const JWT_VALIDITIY_MS = process.env.JWT_VALIDITY_MS;
const JWT_SECRET = process.env.JWT_SECRET;

invariant(JWT_ALGORITHM !== undefined);
invariant(JWT_ISSUER !== undefined);
invariant(JWT_VALIDITIY_MS !== undefined);
invariant(JWT_SECRET !== undefined);

const jwtSignOptions = {
  algorithm: JWT_ALGORITHM,
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
    sign(payload, JWT_SECRET, signOptions, async (err, token) => {
      if (err) {
        return reject(err);
      }

      // JWT generation was successful
      // we now create the refreshToken.
      // and set the refreshTokenExpires to 1 week
      // it is a HMAC of the jwt string
      const refreshToken = hashJWT(token);
      const refreshTokenExpiresAt = moment
        .utc()
        .add(Number(refresh_token_validity_ms), "ms")
        .toDate();
      try {
        await addRefreshToken(user.id, refreshToken, refreshTokenExpiresAt);

        return resolve({ token, refreshToken });
      } catch (err) {
        return reject(err);
      }
    });
  });
};
