import { LoaderFunctionArgs } from "react-router";

/**
 * @openapi
 * /api/hello/{name}:
 *   get:
 *     tags:
 *       - Greetings
 *     summary: Get personalized greeting
 *     description: Returns a personalized greeting message for the given name
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Name to include in the greeting
 *         example: "John"
 *     responses:
 *       200:
 *         description: Successful greeting response
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *             example: "Hello, John!"
 *       400:
 *         description: Bad request - name parameter is missing
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *             example: "Name parameter is required"
 */
export const loader = async ({params}: LoaderFunctionArgs) => {
    const { name } = params;
    if(!name){
        return new Response("Name parameter is required", { status: 400 });
    }
    return new Response(`Hello, ${name}!`, { status: 200 });
}