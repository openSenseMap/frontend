import { LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { BASE_URL } from "vitest.setup";
import { createToken } from "~/lib/jwt";
import { registerUser } from '~/lib/user-service.server'
import { type Device, type User } from "~/schema";
import { createDevice } from "~/models/device.server";
import {action as transferAction} from "~/routes/api.transfer"
import {action as transferUpdateAction, loader as transferLoader} from "~/routes/api.transfer.$deviceId"
import { deleteUserByEmail } from "~/models/user.server";
import { action as claimAction} from "~/routes/api.claim"

const TRANSFER_TEST_USER = {
	name: 'asdfhwerskdfsdfnxmcv',
	email: 'test@asdfasdasehrasdweradfsdjhgjdfhgf.endpoint',
	password: 'highlySecurePasswordForTesting',
}

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

describe("openSenseMap API Routes: /boxes/transfer", () => {

    let user: User | null = null
    let jwt: string = ''
    let queryableDevice: Device | null = null

    let transferToken: string = ''
    let transferBoxId: string = ''

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
    describe('POST', () => {
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
            transferBoxId = body.data.id;
        
            // Assertions
            expect(response.status).toBe(201);
            expect(response.headers.get("content-type")).toBe(
            "application/json; charset=utf-8",
            );
            expect(body).toHaveProperty("message", "Box successfully prepared for transfer");
            expect(body).toHaveProperty("data");
            expect(body.data).toBeDefined();
            expect(body.data.token).toBeDefined();
            expect(typeof body.data.token).toBe("string");
            expect(body.data.token).toHaveLength(12);
        
            expect(body.data.expiresAt).toBeDefined();
            const expiresAt = new Date(body.data.expiresAt);
            const now = new Date();
            const diffInHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
            expect(diffInHours).toBeCloseTo(24, 1);
        
        });
    
    describe('PUT', () => {
        it("should update expiresAt of a transfer token", async () => {
            const newExpiry = new Date();
            newExpiry.setDate(newExpiry.getDate() + 2);
        
            const request = new Request(
              `${BASE_URL}/boxes/transfer/${transferBoxId}`,
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
              params: { id: transferBoxId },
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
            expect(diffInHours).toBeCloseTo(48, 1); // within 1 hour of 48h
          });
    })

    describe('GET', () => {
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
    });

    describe('DELETE', () => {
      it('should revoke and delete a transfer token', async () => {
          // We have to raise the timeout here and wait for the TTL!
          // More information: https://www.mongodb.com/docs/manual/core/index-ttl/#timing-of-the-delete-operation
          
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
              `${BASE_URL}/boxes/transfer/${transferBoxId}`,
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
              params: { id: transferBoxId },
          } as unknown as ActionFunctionArgs)) as Response;

          expect(verifyResponse.status).toBe(404);
          const verifyBody = await verifyResponse.json();
          expect(verifyBody.error).toBe("Transfer not found");
      }, 120000); // 2 minute timeout like in the original test
  });

    afterAll(async () => {
            await deleteUserByEmail(TRANSFER_TEST_USER.email);
    });
  })
})
