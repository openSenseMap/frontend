import { type ActionFunctionArgs } from "react-router";
import { BASE_URL } from "vitest.setup";
import { deleteUserByEmail } from "~/models/user.server";
import { action as userAction } from "~/routes/api.users";

const VALID_USER = {
  name: "this is just a nickname",
  email: "tester@test.test",
  password: "some secure password",
};
const VALID_SECOND_USER = {
  name: "mrtest",
  email: "tester2@test.test",
  password: "12345678",
};

describe("openSenseMap API Routes: /users", () => {
  describe("/register", () => {
    it("should allow to register an user via POST", async () => {
      // Arrange
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(VALID_USER))
        params.append(key, value);
      const request = new Request(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      // Act
      const dataFunctionValue = await userAction({
        request: request,
      } as ActionFunctionArgs);
      const response = dataFunctionValue as Response;
      const body = await response?.json();

      // Assert
      expect(dataFunctionValue).toBeInstanceOf(Response);
      expect(body).toHaveProperty(
        "message",
        "Successfully registered new user",
      );
      expect(response.status).toBe(201);
      expect(response.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(body).toHaveProperty("token");
      expect(body).toHaveProperty("refreshToken");
    });

    it("should deny registering a user with the same email", async () => {
      // Arrange
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(VALID_USER))
        params.append(key, value);
      const request = new Request(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      // Act
      const response = (await userAction({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(body).toHaveProperty("message", "User already exists.");
    });

    it("should deny registering a user with too short password", async () => {
      const params = new URLSearchParams({
        name: "tester",
        password: "short",
        email: "address@email.com",
      });
      const request = new Request(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const response = (await userAction({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(body).toHaveProperty(
        "message",
        "Password must be at least 8 characters long.",
      );
    });

    it("should deny registering a user with no name", async () => {
      const params = new URLSearchParams({
        name: "",
        password: "longenough",
        email: "address@email.com",
      });
      const request = new Request(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const response = (await userAction({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(body).toHaveProperty("message", "Username is required.");
    });

    it("should deny registering a user with missing name parameter", async () => {
      const params = new URLSearchParams({
        password: "longenough",
        email: "address@email.com",
      });
      const request = new Request(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const response = (await userAction({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(body).toHaveProperty("message", "Username is required.");
    });

    it("should deny registering a user with invalid email address", async () => {
      const params = new URLSearchParams({
        name: "tester mc testmann",
        password: "longenough",
        email: "invalid",
      });
      const request = new Request(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const response = (await userAction({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(body).toHaveProperty("message", "Invalid email format.");
    });

    it("should deny registering a too short username", async () => {
      const params = new URLSearchParams({
        name: "t",
        password: "longenough",
        email: "address@email.com",
      });
      const request = new Request(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const response = (await userAction({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(body).toHaveProperty(
        "message",
        "Username must be at least 3 characters long and not more than 40.",
      );
    });

    it("should deny registering a user with username not starting with a letter or number", async () => {
      const params = new URLSearchParams({
        name: " username",
        password: "longenough",
        email: "address@email.com",
      });
      const request = new Request(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const response = (await userAction({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(body).toHaveProperty(
        "message",
        "Username may only contain alphanumerics (a-zA-Z0-9), dots (.), dashes (-), underscores (_) and spaces, and has to start with either a number or a letter.",
      );
    });

    it("should deny registering a user with username with invalid characters", async () => {
      const params = new URLSearchParams({
        name: "user () name",
        password: "longenough",
        email: "address@email.com",
      });
      const request = new Request(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const response = (await userAction({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(body).toHaveProperty(
        "message",
        "Username may only contain alphanumerics (a-zA-Z0-9), dots (.), dashes (-), underscores (_) and spaces, and has to start with either a number or a letter.",
      );
    });

    it("should deny registering a too long username", async () => {
      const params = new URLSearchParams({
        name: "Really Long User Name which is definetely too long to be accepted",
        password: "longenough",
        email: "address@email.com",
      });
      const request = new Request(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const response = (await userAction({
        request,
      } as ActionFunctionArgs)) as Response;
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(body).toHaveProperty(
        "message",
        "Username must be at least 3 characters long and not more than 40.",
      );
    });

    it("should allow registering a second user via POST", async () => {
      // Arrange
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(VALID_SECOND_USER))
        params.append(key, value);
      const request = new Request(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      // Act
      const dataFunctionValue = await userAction({
        request: request,
      } as ActionFunctionArgs);
      const response = dataFunctionValue as Response;
      const body = await response?.json();

      // Assert
      expect(dataFunctionValue).toBeInstanceOf(Response);
      expect(body).toHaveProperty(
        "message",
        "Successfully registered new user",
      );
      expect(response.status).toBe(201);
      expect(response.headers.get("content-type")).toBe(
        "application/json; charset=utf-8",
      );
      expect(body).toHaveProperty("token");
      expect(body).toHaveProperty("refreshToken");
    });
  });

  // it('should allow to register a new user with password leading and trailing spaces', () => {
  //   return chakram.post(`${BASE_URL}/users/register`, { name: 'spaces_tester', password: ' leading and trailing spaces ', email: 'leading_spacesaddress@email.com' })
  //     .then(function (response) {
  //       expect(response).to.have.status(201);
  //       expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
  //       expect(response.body.token).to.exist;

  //       return chakram.post(`${BASE_URL}/users/sign-in`, { email: 'leading_spacesaddress@email.com', password: ' leading and trailing spaces ' });
  //     })
  //     .then(function (response) {
  //       expect(response).to.have.status(200);
  //       expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
  //       expect(response.body.token).to.exist;

  //       return chakram.post(`${BASE_URL}/users/request-password-reset`, { email: 'leading_spacesaddress@email.com' });
  //     })
  //     .then(function (response) {
  //       expect(response).to.have.status(200);

  //       return chakram.wait();
  //     });
  // });

  // it('should allow to change to a password with leading and trailing spaces', () => {
  //   return chakram.put(`${BASE_URL}/users/me`, { newPassword: ' leading and trailing spaces ', currentPassword: '12345678' }, { headers: { 'Authorization': `Bearer ${jwt}` } })
  //     .then(function (response) {
  //       expect(response).to.have.status(200);
  //       expect(response).to.have.json('message', 'User successfully saved. Password changed. Please sign in with your new password');

  //       // try to log in with old token
  //       return chakram.get(`${BASE_URL}/users/me`, { headers: { 'Authorization': `Bearer ${jwt}` } });
  //     })
  //     .then(function (response) {
  //       expect(response).to.have.status(403);

  //       // try to sign in with new password
  //       return chakram.post(`${BASE_URL}/users/sign-in`, { email: 'tester2@test.test', password: ' leading and trailing spaces ' });
  //     })
  //     .then(function (response) {
  //       expect(response).to.have.status(200);
  //       expect(response).to.have.json('data', function (data) {
  //         expect(data.user.email).to.equal('tester2@test.test');
  //       });
  //       expect(response.body.token).to.exist;

  //       jwt = response.body.token;

  //       return chakram.wait();
  //     });
  // });

  // it('should allow to change password with correct current password', () => {
  //   return chakram.put(`${BASE_URL}/users/me`, { newPassword: '12345678910', currentPassword: ' leading and trailing spaces ' }, { headers: { 'Authorization': `Bearer ${jwt}` } })
  //     .then(function (response) {
  //       expect(response).to.have.status(200);
  //       expect(response).to.have.json('message', 'User successfully saved. Password changed. Please sign in with your new password');

  //       // try to log in with old token
  //       return chakram.get(`${BASE_URL}/users/me`, { headers: { 'Authorization': `Bearer ${jwt}` } });
  //     })
  //     .then(function (response) {
  //       expect(response).to.have.status(403);

  //       // try to sign in with new password
  //       return chakram.post(`${BASE_URL}/users/sign-in`, { email: 'tester2@test.test', password: '12345678910' });
  //     })
  //     .then(function (response) {
  //       expect(response).to.have.status(200);
  //       expect(response).to.have.json('data', function (data) {
  //         expect(data.user.email).to.equal('tester2@test.test');
  //       });
  //       expect(response.body.token).to.exist;

  //       jwt = response.body.token;

  //       return chakram.wait();
  //     });
  // });

  // it('should deny to request a fresh jwt using refresh token after changing the password', () => {
  //   return chakram.post(`${BASE_URL}/users/refresh-auth`, { 'token': refreshToken })
  //     .then(function (response) {
  //       expect(response).to.have.status(403);

  //       return chakram.wait();
  //     });
  // });

  // it('should deny to sign in with wrong password', () => {
  //   return chakram.post(`${BASE_URL}/users/sign-in`, { email: 'tester@test.test', password: 'wrong password' })
  //     .then(function (response) {
  //       expect(response).to.have.status(403);

  //       return chakram.wait();
  //     });
  // });

  // it('should allow to sign in an user with email and password', () => {
  //   return chakram.post(`${BASE_URL}/users/sign-in`, valid_user)
  //     .then(function (response) {
  //       expect(response).to.have.status(200);
  //       expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
  //       expect(response.body.token).to.exist;
  //       expect(response.body.refreshToken).to.exist;

  //       return chakram.wait();
  //     });
  // });

  // it('should allow to sign in an user with name and password', () => {
  //   return chakram.post(`${BASE_URL}/users/sign-in`, { email: 'this is just a nickname', password: 'some secure password' })
  //     .then(function (response) {
  //       expect(response).to.have.status(200);
  //       expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
  //       expect(response.body.token).to.exist;
  //       expect(response.body.refreshToken).to.exist;

  //       jwt = response.body.token;
  //       refreshToken = response.body.refreshToken;

  //       return chakram.wait();
  //     });
  // });

  // it('should allow to sign in an user with email (different case) and password', () => {
  //   return chakram.post(`${BASE_URL}/users/sign-in`, { email: 'TESTER@TEST.TEST', password: 'some secure password' })
  //     .then(function (response) {
  //       expect(response).to.have.status(200);
  //       expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
  //       expect(response.body.token).to.exist;
  //       expect(response.body.refreshToken).to.exist;

  //       return chakram.wait();
  //     });
  // });

  // it('should deny to sign in with name in different case', () => {
  //   return chakram.post(`${BASE_URL}/users/sign-in`, { email: 'This Is Just A Nickname', password: 'some secure password' })
  //     .then(function (response) {
  //       expect(response).to.have.status(403);

  //       return chakram.wait();
  //     });
  // });

  // it('should allow to sign out with jwt', () => {
  //   return chakram.post(`${BASE_URL}/users/sign-out`, {}, { headers: { 'Authorization': `Bearer ${jwt}` } })
  //     .then(function (response) {
  //       expect(response).to.have.status(200);
  //       expect(response).to.have.header('content-type', 'application/json; charset=utf-8');

  //       return chakram.wait();
  //     });
  // });

  // it('should deny to use the refreshToken after signing out', () => {
  //   return chakram.post(`${BASE_URL}/users/refresh-auth`, { 'token': refreshToken })
  //     .then(function (response) {
  //       expect(response).to.have.status(403);

  //       return chakram.wait();
  //     });
  // });

  // it('should deny to use revoked jwt', () => {
  //   return chakram.post(`${BASE_URL}/boxes`, valid_sensebox(), { headers: { 'Authorization': `Bearer ${jwt}` } })
  //     .then(function (response) {
  //       expect(response).to.have.status(403);

  //       return chakram.post(`${BASE_URL}/users/sign-in`, valid_user);
  //     })
  //     .then(function (response) {
  //       expect(response).to.have.status(200);
  //       expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
  //       expect(response.body.token).to.exist;
  //       expect(response.body.refreshToken).to.exist;

  //       jwt = response.body.token;
  //       refreshToken = response.body.refreshToken;

  //       return chakram.wait();
  //     });
  // });

  // it('should allow to refresh jwt using the refresh token', () => {
  //   return chakram
  //     .post(
  //       `${BASE_URL}/users/refresh-auth`,
  //       { token: refreshToken }
  //     )
  //     .then(function (response) {
  //       expect(response).to.have.status(200);
  //       expect(response).to.have.header(
  //         'content-type',
  //         'application/json; charset=utf-8'
  //       );
  //       expect(response.body.token).to.exist;
  //       expect(response.body.refreshToken).to.exist;

  //       const jwt = response.body.token;

  //       return chakram.get(`${BASE_URL}/users/me`, {
  //         headers: { Authorization: `Bearer ${jwt}` }
  //       });
  //     })
  //     .then(function (response) {
  //       expect(response).to.have.status(200);
  //       expect(response).to.have.header(
  //         'content-type',
  //         'application/json; charset=utf-8'
  //       );
  //       expect(response).to.have.schema(getUserSchema);
  //       expect(response).to.comprise.of.json({
  //         code: 'Ok',
  //         data: { me: { email: 'tester@test.test' } }
  //       });

  //       return chakram.wait();
  //     });
  // });

  // it('should deny to use an refresh token twice', () => {
  //   return chakram.post(`${BASE_URL}/users/refresh-auth`, { 'token': refreshToken })
  //     .then(function (response) {
  //       expect(response).to.have.status(403);

  //       return chakram.wait();
  //     });
  // });

  // it('should deny to use an old jwt after using a refresh token', () => {
  //   return chakram.post(`${BASE_URL}/boxes`, valid_sensebox(), { headers: { 'Authorization': `Bearer ${jwt}` } })
  //     .then(function (response) {
  //       expect(response).to.have.status(403);

  //       return chakram.post(`${BASE_URL}/users/sign-in`, valid_user);
  //     })
  //     .then(function (response) {
  //       expect(response).to.have.status(200);
  //       expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
  //       expect(response.body.token).to.exist;
  //       expect(response.body.refreshToken).to.exist;

  //       jwt = response.body.token;
  //       refreshToken = response.body.refreshToken;

  //       return chakram.wait();
  //     });
  // });

  // it('should allow to request a password reset token', () => {
  //   return chakram.post(`${BASE_URL}/users/request-password-reset`, valid_user)
  //     .then(function (response) {
  //       expect(response).to.have.status(200);

  //       return chakram.wait();
  //     });
  // });

  // it('should deny password request with wrong token', () => {
  //   return chakram.post(`${BASE_URL}/users/password-reset`, { password: 'ignored_anyway', token: 'invalid_password-reset_token', email: 'tester@test.test' })
  //     .then(function (response) {
  //       expect(response).to.have.status(403);
  //       expect(response).to.have.json({
  //         code: 'Forbidden',
  //         message: 'Password reset for this user not possible'
  //       });

  //       return chakram.wait();
  //     });
  // });

  // it('should deny password change with empty token parameter', () => {
  //   return chakram.post(`${BASE_URL}/users/password-reset`, { password: 'ignored_anyway', token: '   ', email: 'tester@test.test' })
  //     .then(function (response) {
  //       expect(response).to.have.status(400);
  //     });
  // });

  // it('should deny email confirmation with wrong token', () => {
  //   return chakram.post(`${BASE_URL}/users/confirm-email`, { token: 'invalid_password-reset_token', email: 'tester@test.test' })
  //     .then(function (response) {
  //       expect(response).to.have.status(403);

  //       return chakram.wait();
  //     });
  // });

  // it('should allow users request a resend of the email confirmation', () => {
  //   return chakram.post(`${BASE_URL}/users/register`, { name: 'mrtest', email: 'tester4@test.test', password: '12345678' })
  //     .then(function (response) {
  //       expect(response).to.have.status(201);
  //       expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
  //       expect(response.body.token).to.exist;

  //       return chakram.post(`${BASE_URL}/users/me/resend-email-confirmation`, {}, { headers: { 'Authorization': `Bearer ${response.body.token}` } });
  //     })
  //     .then(function (response) {
  //       expect(response).to.have.status(200);
  //       expect(response).to.have.header('content-type', 'application/json; charset=utf-8');
  //       expect(response).to.comprise.of.json({ code: 'Ok', message: 'Email confirmation has been sent to tester4@test.test' });

  //       return chakram.wait();
  //     });
  // });

  // it('should deny to register with multiline username', () => {
  //   return chakram.post(`${BASE_URL}/users/register`, {
  //     name: `multi
  //   line name`, email: 'tester5@test.test', password: '12345678'
  //   })
  //     .then(function (response) {
  //       expect(response).to.have.status(400);
  //       expect(response).to.have.header('content-type', 'application/json; charset=utf-8');

  //       return chakram.wait();
  //     });
  // });

  afterAll(async () => {
    // delete the valid test user
    await deleteUserByEmail(VALID_USER.email);
    await deleteUserByEmail(VALID_SECOND_USER.email);
  });
});
