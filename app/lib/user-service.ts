import invariant from "tiny-invariant";
import { createUser, getUserByEmail } from "~/models/user.server";
import { type User } from "~/schema";

type RegistrationInputValidation = {
  validationKind: "username" | "email" | "password";
};

export type UsernameValidation = {
  isValid: boolean;
  required?: boolean;
  length?: boolean;
  invalidCharacters?: boolean;
} & RegistrationInputValidation;
/**
 * Validates a username against set criteria.
 * @param {string} username The username to validate
 * @returns {UsernameValidation} A validation object with optional fields indicating
 * validation issues if existing. Use the `isValid` field to quickly check if the
 * username is valid. If it is false, the other fields indicate the type of issue in the given username.
 */
export const validateUsername = (username: string): UsernameValidation => {
  const nameValidRegex =
    /^[^~`!@#$%^&*()+=£€{}[\]|\\:;"'<>,?/\n\r\t\s][^~`!@#$%^&*()+=£€{}[\]|\\:;"'<>,?/\n\r\t]{1,39}[^~`!@#$%^&*()+=£€{}[\]|\\:;"'<>,?/\n\r\t\s]$/;

  if (username.length === 0)
    return { isValid: false, required: true, validationKind: "username" };
  else if (username.length < 3 || username.length > 40)
    return { isValid: false, length: true, validationKind: "username" };
  else if (
    username &&
    !nameValidRegex.test(username)
  )
    return {
      isValid: false,
      invalidCharacters: true,
      validationKind: "username",
    };

  return { isValid: true, validationKind: "username" };
};

export type EmailValidation = {
  isValid: boolean;
  required?: boolean;
  format?: boolean;
} & RegistrationInputValidation;
/**
 * Validates an email address against common criteria.
 * @param {string} email The email to validate
 * @returns {EmailValidation} A validation object with optional fields indicating
 * validation issues if existing. Use the `isValid` field to quickly check if the
 * email is valid. If it is false, the other fields indicate the type of issue in the given email.
 */
export const validateEmail = (email: string): EmailValidation => {
  if (email.length <= 3)
    return { isValid: false, required: true, validationKind: "email" };
  if (!email.includes("@"))
    return { isValid: false, format: true, validationKind: "email" };
  return { isValid: true, validationKind: "email" };
};

export type PasswordValidation = {
  isValid: boolean;
  required?: boolean;
  length?: boolean;
} & RegistrationInputValidation;
export const validatePassword = (password: string): PasswordValidation => {
  if (password.length === 0)
    return { isValid: false, required: true, validationKind: "password" };
  if (password.length < 8)
    return { isValid: false, length: true, validationKind: "password" };
  return { isValid: true, validationKind: "password" };
};

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

  invariant(newUsers.length === 1, "Expected to only get a single user account returned");
  return newUsers[0];
};
