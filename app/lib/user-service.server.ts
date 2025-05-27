import invariant from "tiny-invariant";
import {
  type EmailValidation,
  type PasswordValidation,
  type UsernameValidation,
  validateEmail,
  validatePassword,
  validateUsername,
} from "./user-service";
import { createUser, getUserByEmail } from "~/models/user.server";
import { type User } from "~/schema";

/**
 * Register a new user with the database.
 * @param {string} username Username for the new user profile
 * @param {string} email Email address for the new profile
 * @param {string} password Password for the new profile
 * @param language Language as IETF BCP 47 (e.g. de_DE)
 * @returns If successful, the new user profile is returned. If unsuccessful a validation object
 * is returned that indicates what is wrong with the request. Null is returned when the user profile
 * with the given email already exists.
 */
export const registerUser = async (
  username: string,
  email: string,
  password: string,
  language: "de_DE" | "en_US",
): Promise<
  UsernameValidation | EmailValidation | PasswordValidation | User | null
> => {
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.isValid) return usernameValidation;

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) return emailValidation;

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) return passwordValidation;

  const existingUser = await getUserByEmail(email);
  if (existingUser) return null; // no new user is created -> null

  const newUsers = await createUser(username, email, language, password);
  if (newUsers.length === 0)
    throw new Error("Something went wrong creating the user profile!");

  invariant(
    newUsers.length === 1,
    "Expected to only get a single user account returned",
  );
  return newUsers[0];
};
