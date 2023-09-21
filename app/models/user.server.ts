import type { Password, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

import { drizzleClient, prisma } from "~/db.server";
import { createProfile } from "./profile.server";
import { user } from "drizzle/schema";
import type { SelectPassword, SelectUser } from "drizzle/schema";
import { eq } from "drizzle-orm";

export type { User } from "@prisma/client";

export async function getUserById(id: SelectUser["id"]) {
  return drizzleClient.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, id),
  });
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } });
}

export async function deleteUserByEmail(email: SelectUser["email"]) {
  return drizzleClient.delete(user).where(eq(user.email, email));
}

//* user name shouldn't be unique
/* export async function getUserByName(name: User["name"]) {
  return prisma.user.findUnique({ where: { name } });
} */

export async function updateUserName(
  email: User["email"],
  newUserName: string
) {
  return prisma.user.update({
    where: { email },
    data: {
      name: newUserName,
    },
  });
}

export async function updateUserPassword(
  userId: Password["userId"],
  password: string
) {
  const hashedPassword = await bcrypt.hash(preparePasswordHash(password), 13);
  return prisma.password.update({
    where: { userId },
    data: {
      hash: hashedPassword,
    },
  });
}

export async function updateUserlocale(
  email: User["email"],
  language: User["language"]
) {
  return prisma.user.update({
    where: { email },
    data: {
      language: language,
    },
  });
}

export async function getUsers() {
  return drizzleClient.query.user.findMany();
}

const preparePasswordHash = function preparePasswordHash(
  plaintextPassword: string
) {
  // first round: hash plaintextPassword with sha512
  const hash = crypto.createHash("sha512");
  hash.update(plaintextPassword.toString(), "utf8");
  const hashed = hash.digest("base64"); // base64 for more entropy than hex

  return hashed;
};

export async function createUser(
  name: User["name"],
  email: User["email"],
  language: User["language"],
  password: string
) {
  const hashedPassword = await bcrypt.hash(preparePasswordHash(password), 13); // make salt_factor configurable oSeM API uses 13 by default

  const user = await prisma.user.create({
    data: {
      name,
      email,
      language,
      boxes: [],
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });

  await createProfile(user.id, name);

  return user;
}

export async function verifyLogin(
  email: SelectUser["email"],
  password: SelectPassword["hash"]
) {
  const userWithPassword = await drizzleClient.query.user.findFirst({
    where: (user, { eq }) => eq(user.email, email),
    with: {
      profile: true,
      password: true,
    },
  });
  console.log(userWithPassword);

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  //* compare stored password with entered one
  const isValid = await bcrypt.compare(
    preparePasswordHash(password),
    userWithPassword.password.hash
  );

  if (!isValid) {
    return null;
  }

  //* exclude password property (using spread operator)
  //* const userWithoutPassword: {id: string; email: string;createdAt: Date; updatedAt: Date;}
  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}
