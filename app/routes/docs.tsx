// app/routes/docs.tsx
import { FileText, Loader2 } from 'lucide-react';
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
    const navigation = useNavigation();
  
  // Show loading when navigating to this route
  const isLoading = navigation.state === "loading" && 
                   navigation.location?.pathname === "/docs";
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-500" />
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
        <p className="text-lg text-gray-600">Loading API Documentation...</p>
      </div>
    );
  }
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