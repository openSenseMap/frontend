// app/routes/docs.tsx
import { useLoaderData, useNavigation} from 'react-router';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { openapiSpecification } from '~/lib/openapi'; // Direct import

// In production, use the pre-built file
const isProduction = process.env.NODE_ENV === 'production';

export const loader = async () => {
     if (isProduction) {
        const spec = await import('../../public/openapi.json');
        return Response.json(spec);
        }
    return Response.json(openapiSpecification);
};

export default function ApiDocumentation() {
  const spec = useLoaderData<typeof loader>();
  return (
  <div style={{ height: '100vh', overflow: 'auto', scrollbarWidth: 'thin'}}>
    <div>
      <div className='flex items-center justify-center p-3'>
        <img src="./openSenseMap_API.png" alt="API Image" height={250} width={250}/>
      </div>
      <SwaggerUI spec={spec}/>
    </div>
  </div>
);
}