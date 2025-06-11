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
  <>
    <div>
      <img src="/openSenseMap_API.png" alt="" height={300} width={300} className='px-3 mt-2'/>
    </div>
    <div style={{ height: '100vh', overflow: 'auto', scrollbarWidth: 'none'}}>
      <SwaggerUI spec={spec}/>
      </div>
  </>
);
}