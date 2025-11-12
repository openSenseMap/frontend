/**
 * Creates a response object for a bad request
 * @param message The message for the response
 * @returns The response
 */
export function badRequest(message: string): Response {
	return Response.json(
		{
			error: 'Bad Request',
			message: message,
		},
		{
			status: 400,
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
			},
		},
	)
}

/**
 * Creates a response object for an internal server error
 * @param message The message for the response. Default:
 *  The server was unable to complete your request. Please try again later.
 * @returns The response
 */
export function internalServerError(message =
    "The server was unable to complete your request. Please try again later."): Response {
        Response.error()
    return Response.json(
      {
        error: "Internal Server Error",
        message: message
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
}

/**
 * Creates a response object for a 404
 * @param message The message for the response
 * @returns The response
 */
export function notFound(message: string): Response {
    return Response.json(
			{
				error: 'Not found',
				message: message,
			},
			{
				status: 404,
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
				},
			},
		)
}
