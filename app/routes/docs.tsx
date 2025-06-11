// app/routes/docs.tsx
import { useLoaderData } from 'react-router';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { openapiSpecification } from '~/lib/openapi'; // Direct import

export const loader = async () => {
  return Response.json(openapiSpecification);
};

export default function ApiDocumentation() {
  const spec = useLoaderData<typeof loader>();
  return (
  <div style={{ height: '100vh', overflow: 'auto' }}>
    <div>
      <img src="../../public/openSenseMap_API.png" alt="" height={300} width={300} className='mt-2'/>
    </div>
    <SwaggerUI spec={spec} />
    </div>
);
}