import { type ActionFunctionArgs } from "react-router";
import {
  type EmailValidation,
  type PasswordValidation,
  registerUser,
  type UsernameValidation,
} from "~/lib/user-service";
import { type User } from "~/schema";

const DEFAULT_LANGUAGE: "de_DE" | "en_US" = "en_US";

export async function action({ request }: ActionFunctionArgs) {
  const method = request.method;
  if (method !== "POST")
    return new Response("Method Not Allowed", { status: 405 });

  const formEntries = await request.formData();
  const username = formEntries.get("name")?.toString() ?? "";
  const email = formEntries.get("email")?.toString() ?? "";
  const password = formEntries.get("password")?.toString() ?? "";
  const language =
    (formEntries.get("language")?.toString() ?? DEFAULT_LANGUAGE).indexOf(
      "de_DE",
    ) > 0
      ? "de_DE"
      : "en_US";

  try {
    const registration = await registerUser(
      username,
      email,
      password,
      language,
    );
    if (!registration)
      // null is returned when no new user profile was created because it already exists
      return new Response("User already exists.", { status: 400 });

    if ("validationKind" in registration) {
      // A validation was returned, therefore a bad request was sent in
      console.log(registration);
      let msg = "Bad Request";
      switch (registration.validationKind) {
        case "username":
          const usernameValidation = registration as UsernameValidation;
          if (usernameValidation.required) msg = "Username is required.";
          if (usernameValidation.length)
            msg =
              "Username must be at least 3 characters long and not more than 40.";
          if (usernameValidation.invalidCharacters)
            msg =
              "Username may only contain alphanumerics (a-zA-Z0-9), dots (.), dashes (-), underscores (_) and spaces.";
          break;
        case "email":
          const emailValidation = registration as EmailValidation;
          if (emailValidation.required) msg = "Email is required.";
          if (emailValidation.format) msg = "Invalid email format";
          break;
        case "password":
          const passwordValidation = registration as PasswordValidation;
          if (passwordValidation.required) msg = "Password is required.";
          if (passwordValidation.length)
            msg = "Password must be at least 8 characters logn.";
          break;
      }
      return new Response(msg, { status: 400 });
    }

    const user = registration as User;
    // TODO return JWT etc
    
    return new Response(
      JSON.stringify({
        message: "Successfully registered new user",
        token: "",
        refreshToken: "",
        data: user,
      }),
      {
        status: 201,
      },
    );
  } catch {
    return new Response("Internal Server Error", { status: 500 });
  }
}
