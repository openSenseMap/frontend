import { useLoaderData } from "react-router";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export const loader = async () => {
  if (process.env.NODE_ENV === "production") {
    const spec = await import("../../public/openapi.json");
    return Response.json({ spec });
  }

  const { combinedOpenapiSpecification } = await import(
    "~/lib/openapi.combined"
  );

  return Response.json({
    spec: combinedOpenapiSpecification(),
  });
};


export default function ApiDocumentation() {
  const { spec } = useLoaderData<typeof loader>();

  return (
    <main className="container mx-auto p-6">
      <div className="flex justify-center p-3">
        <img
          src="./openSenseMap_API.png"
          alt="API Image"
          width={350}
        />
      </div>

      {/* Optional manual TOC */}
      <div className="mb-6 flex gap-4 justify-center">
        <a href="#public-api" className="text-blue-600 hover:underline">
          Public API
        </a>
        <a href="#integration-api" className="text-green-600 hover:underline">
          Integration API
        </a>
      </div>

      <SwaggerUI
        spec={spec}
        docExpansion="list"
        defaultModelsExpandDepth={1}
      />
    </main>
  );
}
