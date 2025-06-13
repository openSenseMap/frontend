import { openapiSpecification } from '~/lib/openapi';

export const loader = () => {
  return Response.json(openapiSpecification);
};