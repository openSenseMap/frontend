import { LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { BASE_URL } from "vitest.setup";
import { createToken } from "~/lib/jwt";
import { registerUser } from '~/lib/user-service.server'
import { type Device, type User } from "~/schema";
import { createDevice, getDevice } from "~/models/device.server";
import {action as transferAction} from "~/routes/api.transfer"
import {action as transferUpdateAction, loader as transferLoader} from "~/routes/api.transfer.$deviceId"
import {action as claimAction} from "~/routes/api.claim"
import { deleteUserByEmail } from "~/models/user.server";

const TRANSFER_TEST_USER = {
	name: 'asdfhwerskdfsdfnxmcv',
	email: 'test@asdfasdasehrasdweradfsdjhgjdfhgf.endpoint',
	password: 'highlySecurePasswordForTesting',
}

const createTestUser = async (suffix: string): Promise<User> => {
    const result = await registerUser(
        "testuser" + suffix,
        `test${suffix}@test.com`,
        "password123",
        "en_US"
    );

    if (!result || (typeof result === 'object' && 'isValid' in result)) {
        throw new Error("Failed to create test user");
    }

    return result as User;
};

const generateMinimalDevice = (
	location: number[] | {} = [123, 12, 34],
	exposure = 'mobile',
	name = '' + new Date().getTime(),
) => ({
	exposure,
	location,
	name,
	model: 'homeV2Ethernet',
})

describe("openSenseMap API Routes: /boxes/transfer and /boxes/claim", () => {

    let user: User | null = null
    let jwt: string = ''
    let queryableDevice: Device | null = null

    let transferToken: string = ''
    let transferClaimId: string = ''

    beforeAll(async () => {
        const testUser = await registerUser(
            TRANSFER_TEST_USER.name,
            TRANSFER_TEST_USER.email,
            TRANSFER_TEST_USER.password,
            'en_US',
        )
        user = testUser as User
        const { token: t } = await createToken(testUser as User)
        jwt = t

        queryableDevice = await createDevice(
            { ...generateMinimalDevice(), latitude: 123, longitude: 12 },
            (testUser as User).id,
        )

    })
    
    describe('POST /boxes/transfer', () => {
        it("should mark a device for transferring", async () => {
                    
            const request = new Request(`${BASE_URL}/boxes/transfer`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Bearer ${jwt}` 
            },
            body: new URLSearchParams({ boxId: queryableDevice!.id }),
            });
        
            const response = (await transferAction({
            request,
            } as ActionFunctionArgs)) as Response;
            
            const body = await response.json();

            transferToken = body.data.token;
            transferClaimId = body.data.id;
        
            // Assertions
            expect(response.status).toBe(201);
            expect(body).toHaveProperty("message", "Box successfully prepared for transfer");
            expect(body).toHaveProperty("data");
            expect(body.data).toBeDefined();
            expect(body.data.token).toBeDefined();
            expect(typeof body.data.token).toBe("string");
            expect(body.data.token).toHaveLength(12);
            expect(/^[0-9a-f]{12}$/.test(body.data.token)).toBe(true); // Hex format check
        
            expect(body.data.expiresAt).toBeDefined();
            const expiresAt = new Date(body.data.expiresAt);
            const now = new Date();
            const diffInHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
            expect(diffInHours).toBeCloseTo(24, 1);
        });

        it("should reject if boxId is missing", async () => {
            const request = new Request(`${BASE_URL}/boxes/transfer`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": `Bearer ${jwt}` 
                },
                body: new URLSearchParams({}),
            });
        
            const response = (await transferAction({
                request,
            } as ActionFunctionArgs)) as Response;
            
            expect(response.status).toBe(400);
            const body = await response.json();
            expect(body.error).toContain("required");
        });

        it("should reject if device does not exist", async () => {
            const request = new Request(`${BASE_URL}/boxes/transfer`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": `Bearer ${jwt}` 
                },
                body: new URLSearchParams({ boxId: "nonexistent-device-id" }),
            });
        
            const response = (await transferAction({
                request,
            } as ActionFunctionArgs)) as Response;
            
            expect(response.status).toBe(404);
            const body = await response.json();
            expect(body.error).toContain("not found");
        });

        it("should reject if user does not own the device", async () => {
            // Create another user
            const otherUser = await registerUser(
                "other" + Date.now(),
                `other${Date.now()}@test.com`,
                "password123",
                "en_US"
            );
            const { token: otherJwt } = await createToken(otherUser as User);

            const request = new Request(`${BASE_URL}/boxes/transfer`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${otherJwt}` 
                },
                body: JSON.stringify({ boxId: queryableDevice!.id }),
            });
        
            const response = (await transferAction({
                request,
            } as ActionFunctionArgs)) as Response;
            
            expect(response.status).toBe(403);
            const body = await response.json();
            expect(body.error).toContain("permission");

            // Cleanup
            await deleteUserByEmail((otherUser as User).email);
        });
    })
    
    describe('GET /boxes/transfer/:deviceId', () => {
        it("should get transfer information for a device", async () => {
            const request = new Request(
                `${BASE_URL}/boxes/transfer/${queryableDevice!.id}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                    },
                },
            );
    
            const response = (await transferLoader({
                request,
                params: { deviceId: queryableDevice!.id },
            } as unknown as LoaderFunctionArgs)) as Response;
            
            const body = await response.json();
    
            expect(response.status).toBe(200);
            expect(body).toHaveProperty("data");
            expect(body.data).not.toBeNull();
            expect(body.data.boxId).toBe(queryableDevice!.id);
            expect(body.data.token).toBe(transferToken);
        });

        it("should reject if user does not own the device", async () => {
            const otherUser = await registerUser(
                "other" + Date.now(),
                `other${Date.now()}@test.com`,
                "password123",
                "en_US"
            );
            const { token: otherJwt } = await createToken(otherUser as User);

            const request = new Request(
                `${BASE_URL}/boxes/transfer/${queryableDevice!.id}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${otherJwt}`,
                    },
                },
            );
    
            const response = (await transferLoader({
                request,
                params: { deviceId: queryableDevice!.id },
            } as unknown as LoaderFunctionArgs)) as Response;
            
            expect(response.status).toBe(403);
            const body = await response.json();
            expect(body.error).toContain("permission");

            // Cleanup
            await deleteUserByEmail((otherUser as User).email);
        });
    })

    describe('PUT /boxes/transfer/:deviceId', () => {
        it("should update expiresAt of a transfer token", async () => {
            const newExpiry = new Date();
            newExpiry.setDate(newExpiry.getDate() + 2);
        
            const request = new Request(
              `${BASE_URL}/boxes/transfer/${queryableDevice!.id}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                  Authorization: `Bearer ${jwt}`,
                },
                body: new URLSearchParams({
                  token: transferToken,
                  expiresAt: newExpiry.toISOString(),
                }),
              },
            );
        
            const response = (await transferUpdateAction({
              request,
              params: { deviceId: queryableDevice!.id },
            } as unknown as ActionFunctionArgs)) as Response;
        
            const body = await response.json();
        
            expect(response.status).toBe(200);
            expect(body.message).toBe("Transfer successfully updated");
            expect(body.data).toBeDefined();
            expect(body.data.token).toHaveLength(12);
            expect(body.data.token).toBe(transferToken);
        
            const expiresAt = new Date(body.data.expiresAt);
            const diffInHours =
              (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
            expect(diffInHours).toBeCloseTo(48, 1);
          });

        it("should reject with invalid token", async () => {
            const newExpiry = new Date();
            newExpiry.setDate(newExpiry.getDate() + 2);
        
            const request = new Request(
              `${BASE_URL}/boxes/transfer/${queryableDevice!.id}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify({
                  token: "invalid-token-12345",
                  expiresAt: newExpiry.toISOString(),
                }),
              },
            );
        
            const response = (await transferUpdateAction({
              request,
              params: { deviceId: queryableDevice!.id },
            } as unknown as ActionFunctionArgs)) as Response;
        
            expect(response.status).toBe(400);
            const body = await response.json();
            expect(body.error).toContain("Invalid");
          });

        it("should reject with past expiration date", async () => {
            const pastExpiry = new Date();
            pastExpiry.setDate(pastExpiry.getDate() - 1);
        
            const request = new Request(
              `${BASE_URL}/boxes/transfer/${queryableDevice!.id}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify({
                  token: transferToken,
                  expiresAt: pastExpiry.toISOString(),
                }),
              },
            );
        
            const response = (await transferUpdateAction({
              request,
              params: { deviceId: queryableDevice!.id },
            } as unknown as ActionFunctionArgs)) as Response;
        
            expect(response.status).toBe(400);
            const body = await response.json();
            expect(body.error).toContain("future");
          });
    })

    describe('DELETE /boxes/transfer', () => {
      it('should revoke and delete a transfer token', async () => {
          const request = new Request(`${BASE_URL}/boxes/transfer`, {
              method: "DELETE",
              headers: { 
                  "Content-Type": "application/x-www-form-urlencoded",
                  "Authorization": `Bearer ${jwt}` 
              },
              body: new URLSearchParams({ 
                  boxId: queryableDevice!.id,
                  token: transferToken 
              }),
          });

          const response = (await transferAction({
              request,
          } as ActionFunctionArgs)) as Response;

          expect(response.status).toBe(204);

          // Verify the transfer token is actually deleted by trying to update it
          const verifyRequest = new Request(
              `${BASE_URL}/boxes/transfer/${queryableDevice!.id}`,
              {
                  method: "PUT",
                  headers: {
                      "Content-Type": "application/x-www-form-urlencoded",
                      Authorization: `Bearer ${jwt}`,
                  },
                  body: new URLSearchParams({
                      token: transferToken,
                      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  }),
              },
          );

          const verifyResponse = (await transferUpdateAction({
              request: verifyRequest,
              params: { deviceId: queryableDevice!.id },
          } as unknown as ActionFunctionArgs)) as Response;

          expect(verifyResponse.status).toBe(404);
          const verifyBody = await verifyResponse.json();
          expect(verifyBody.error).toContain("not found");
      });
    });

    describe('POST /boxes/claim', () => {
        it("should claim a device and transfer ownership from one user to another", async () => {
            // Create a new transfer for the claim test
            const createTransferRequest = new Request(`${BASE_URL}/boxes/transfer`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": `Bearer ${jwt}` 
                },
                body: new URLSearchParams({ boxId: queryableDevice!.id }),
            });
        
            const transferResponse = (await transferAction({
                request: createTransferRequest,
            } as ActionFunctionArgs)) as Response;
            
            const transferBody = await transferResponse.json();
            const claimToken = transferBody.data.token;
  
            const newUser = await createTestUser(Date.now().toString());
            const { token: newUserJwt } = await createToken(newUser);
  
            // Claim the device
            const claimRequest = new Request(`${BASE_URL}/boxes/claim`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${newUserJwt}`,
                },
                body: JSON.stringify({ token: claimToken }),
            });
  
            const claimResponse = (await claimAction({
                request: claimRequest,
            } as ActionFunctionArgs)) as Response;
  
            expect(claimResponse.status).toBe(200);
            const claimBody = await claimResponse.json();
            expect(claimBody.message).toBe("Device successfully claimed!");
            expect(claimBody.data.boxId).toBe(queryableDevice!.id);
  
            // Verify the device is now owned by the new user
            // (You would need a GET /users/me endpoint or similar to verify this)
            // For now, verify that the device's userId has been updated by querying it
            const updatedDevice = await getDevice({ id: queryableDevice!.id });
            expect(updatedDevice?.user.id).toBe(newUser?.id);
  
            // Verify the transfer token is deleted (can't be used again)
            const reusedClaimRequest = new Request(`${BASE_URL}/boxes/claim`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${newUserJwt}`,
                },
                body: JSON.stringify({ token: claimToken }),
            });
  
            const reusedResponse = (await claimAction({
                request: reusedClaimRequest,
            } as ActionFunctionArgs)) as Response;
  
            expect(reusedResponse.status).toBe(410);
  
            // Cleanup
            await deleteUserByEmail((newUser as User).email);
        });
  
        it("should reject claim with invalid content-type", async () => {
            const claimRequest = new Request(`${BASE_URL}/boxes/claim`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: `Bearer ${jwt}`,
                },
                body: new URLSearchParams({ token: "some-token" }),
            });
  
            const claimResponse = (await claimAction({
                request: claimRequest,
            } as ActionFunctionArgs)) as Response;
  
            expect(claimResponse.status).toBe(415);
            const body = await claimResponse.json();
            expect(body.code).toBe("NotAuthorized");
            expect(body.message).toContain("application/json");
        });
  
        it("should reject claim without Authorization header", async () => {
            const claimRequest = new Request(`${BASE_URL}/boxes/claim`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token: "some-token" }),
            });
  
            const claimResponse = (await claimAction({
                request: claimRequest,
            } as ActionFunctionArgs)) as Response;
  
            expect(claimResponse.status).toBe(403);
            const body = await claimResponse.json();
            expect(body.code).toBe("Forbidden");
        });
  
        it("should reject claim with expired transfer token", async () => {
            // Create a new user to attempt the claim
            const newUser = await registerUser(
                "claimer" + Date.now(),
                `claimer${Date.now()}@test.com`,
                "password123",
                "en_US"
            );
            const { token: newUserJwt } = await createToken(newUser as User);
  
            const claimRequest = new Request(`${BASE_URL}/boxes/claim`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${newUserJwt}`,
                },
                body: JSON.stringify({ token: "invalid-or-expired-token" }),
            });
  
            const claimResponse = (await claimAction({
                request: claimRequest,
            } as ActionFunctionArgs)) as Response;
  
            expect(claimResponse.status).toBe(410);
            const body = await claimResponse.json();
            expect(body.error).toContain("expired");
  
            // Cleanup
            await deleteUserByEmail((newUser as User).email);
        });
      });

    afterAll(async () => {
            await deleteUserByEmail(TRANSFER_TEST_USER.email);
    });
})