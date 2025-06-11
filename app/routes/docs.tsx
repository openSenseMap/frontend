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
  <div style={{ height: '100vh', overflow: 'auto', scrollbarWidth: 'thin'}}>
    <div>
      <img src="/openSenseMap_API.png" alt="" height={350} width={350} className='px-3 mt-2'/>
    </div>
    <div>
      <SwaggerUI spec={spec}/>
      </div>
  </div>
);
}