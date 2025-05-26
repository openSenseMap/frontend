import invariant from "tiny-invariant";
import { revokeToken } from "./jwt";
import {
  createUser,
  deleteUserByEmail,
  getUserByEmail,
  updateUserEmail,
  updateUserlocale,
  updateUserName,
  updateUserPassword,
  verifyLogin,
} from "~/models/user.server";
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
  else if (username && !nameValidRegex.test(username))
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

  invariant(
    newUsers.length === 1,
    "Expected to only get a single user account returned",
  );
  return newUsers[0];
};

/**
 * Updates an existing user setting using the provided properties given to this function.
 * The response contains a messages array that collects a message per updated property.
 * Additionally the user is signed out when the password is changed. This is reflected
 * in the response object as well.
 * @param user The user to update
 * @param details An object containing the user details to update
 * @returns An object indicating whether the user profile has been changed, if the user is signed out and what
 * messages have been produced during the update procedure (e.g. for each field updated).
 */
export const updateUserDetails = async (
  user: User,
  jwtString: string,
  details: {
    email?: string;
    language?: "de_DE" | "en_US";
    name?: string;
    currentPassword?: string;
    newPassword?: string;
  },
): Promise<{
  updated: boolean;
  signOut: boolean;
  messages: string[];
  updatedUser: User;
}> => {
  const { email, language, name, currentPassword, newPassword } = details;
  const messages = [];

  // don't allow email and password change in one request
  if (email && newPassword) {
    messages.push(
      "You cannot change your email address and password in the same request.",
    );
    return {
      updated: false,
      signOut: false,
      messages: messages,
      updatedUser: user,
    };
  }

  // for password and email changes, require parameter currentPassword to be valid
  if ((newPassword && newPassword !== "") || (email && email !== "")) {
    if (!currentPassword) {
      messages.push(
        "To change your password or email address, please supply your current password.",
      );
      return {
        updated: false,
        signOut: false,
        messages: messages,
        updatedUser: user,
      };
    }

    const login = await verifyLogin(user.email, currentPassword);
    if (login === null) {
      messages.push("Password incorrect");
      return {
        updated: false,
        signOut: false,
        messages: messages,
        updatedUser: user,
      };
    }

    if (newPassword && validatePassword(newPassword).isValid === false) {
      messages.push("New password should have at least 8 characters");
      return {
        updated: false,
        signOut: false,
        messages: messages,
        updatedUser: user,
      };
    }
  }

  // If specified, make sure the email is valid
  if (email && !validateEmail(email).isValid) {
    messages.push("Invalid email address");
    return {
      updated: false,
      signOut: false,
      messages: messages,
      updatedUser: user,
    };
  }

  // If specified, make sure the username is valid
  if (name && !validateUsername(name).isValid) {
    messages.push("Invalid username");
    return {
      updated: false,
      signOut: false,
      messages: messages,
      updatedUser: user,
    };
  }

  let signOut = false;
  let hasChanges = false;

  if (name && user.name !== name) {
    await updateUserName(user.email, name);
    messages.push("Name changed.");
    hasChanges = true;
  }

  if (language && user.language !== language) {
    await updateUserlocale(user.email, language);
    messages.push("Language changed.");
    hasChanges = true;
  }

  if (email && user.email !== email && validateEmail(email).isValid) {
    await updateUserEmail(user, email);
    messages.push(
      "E-Mail changed. Please confirm your new address. Until confirmation, sign in using your old address",
    );
    hasChanges = true;
  }

  if (newPassword) {
    await updateUserPassword(user.id, newPassword);
    await revokeToken(user, jwtString);
    messages.push("Password changed. Please sign in with your new password");
    signOut = true;
    hasChanges = true;
  }

  if (hasChanges) {
    const updatedUser = await getUserByEmail(email ?? user.email);
    return {
      updated: true,
      signOut,
      messages,
      updatedUser: updatedUser ?? user,
    };
  }

  return {
    updated: false,
    messages: [],
    signOut: false,
    updatedUser: user,
  };
};

/**
 * Deletes a user account after verifiying that the user is entitled by checking
 * the password and revoking the token.
 * @param user The user to delete
 * @param password The users password to verify in addition to the jwt
 * @param jwtString The jwt token to revoke prior to deletion
 * @returns True if the user was deleted, otherwise false or "unauthorized"
 * if the user is not entitle to delete with the given parameters
 */
export const deleteUser = async (
  user: User,
  password: string,
  jwtString: string,
): Promise<boolean | "unauthorized"> => {
  const verifiedUser = await verifyLogin(user.email, password);
  if (verifiedUser === null) return "unauthorized";
  await revokeToken(user, jwtString);
  return (await deleteUserByEmail(user.email)).count > 0;
};
