import { z } from "zod";
import { type Route } from "./+types/api.users.sign-in";
import { StandardResponse } from "~/lib/responses";
import { signIn } from "~/services/user-service.server";
import { type ZodOpenApiPathItemObject } from "zod-openapi";
import {
  requestContentTypeJson,
  responseContentTypeJson,
} from "~/middleware/content-type-header.server";

const errorMessages = {
  email: "You must specify either your email or your username",
  password: "You must specify your password to sign in",
  userAndOrPassword: "User and or password not valid!",
};

const PostRequestSchema = z.object({
  email: z.string(errorMessages.email).trim().nonempty().meta({
    description: "User's email address or username",
    example: "user@example.com",
  }),
  password: z.string(errorMessages.password).nonempty().min(8).meta({
    description: "User's password",
    example: "mySecurePassword123",
  }),
});

const PostResponseSchema = z.object({
  data: z.object(
    {
      user: z.object({
        name: z.string(),
        ...PostRequestSchema.pick({ email: true }).shape,
        role: z.string(),
        language: z.string(),
        emailIsConfirmed: z.boolean(),
        boxes: z.array(z.string()).meta({
          description: "A list of ids of the users devices",
          example: ["60a13611a877b3001b8ffd59", "5bdbe70f55d0ad001a04edc9"],
        }),
      }),
    },
    errorMessages.userAndOrPassword,
  ),
  token: z.jwt({ alg: "HS256", error: errorMessages.userAndOrPassword }).meta({
    description: "valid json web token",
  }),
  refreshToken: z.string(errorMessages.userAndOrPassword).meta({
    description: "valid json web token",
  }),
  code: z.literal("Authorized").default("Authorized"),
  message: z.literal("Successfully signed in").default("Successfully signed in"),
});

export const openapi: ZodOpenApiPathItemObject = {
  post: {
    tags: ["Auth"],
    summary: "Sign in using email or name and password",
    requestBody: {
      required: true,
      content: {
        "application/json": { schema: PostRequestSchema },
      },
    },
    responses: {
      200: {
        description: "Signed in",
        content: {
          "application/json": { schema: PostResponseSchema },
        },
      },
      403: {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: z.object({
              code: z.literal("Forbidden"),
              message: z.xor([
                z.literal(errorMessages.email),
                z.literal(errorMessages.password),
                z.literal(errorMessages.userAndOrPassword),
              ]),
              error: z.xor([
                z.literal(errorMessages.email),
                z.literal(errorMessages.password),
                z.literal(errorMessages.userAndOrPassword),
              ]),
            }),
          },
        },
      },
      500: {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: z.object({
              code: z.literal("Internal Server Error"),
              message: z.literal(
                "The server was unable to complete your request. Please try again later.",
              ),
              error: z.literal(
                "The server was unable to complete your request. Please try again later.",
              ),
            }),
          },
        },
      },
    },
  },
};

export const middleware: Route.MiddlewareFunction[] = [
  requestContentTypeJson,
  responseContentTypeJson,
];

export const action = async ({ request }: Route.ActionArgs) => {
  try {
    const requestParsed = await PostRequestSchema.safeParseAsync(await request.json());
    if (!requestParsed.success)
      return StandardResponse.forbidden(requestParsed.error.issues[0].message);

    const { email, password } = requestParsed.data;
    const { user, jwt, refreshToken } = (await signIn(email, password)) || {};

    const responseParsed = await PostResponseSchema.safeParseAsync({
      data: { user },
      token: jwt,
      refreshToken,
    });
    if (!responseParsed.success)
      return StandardResponse.forbidden(responseParsed.error.issues[0].message);

    return StandardResponse.ok(responseParsed.data);
  } catch (error) {
    console.warn(error);
    return StandardResponse.internalServerError();
  }
};
