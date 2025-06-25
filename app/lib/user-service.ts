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
