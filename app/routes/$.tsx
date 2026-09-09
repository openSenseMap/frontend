import { StandardResponse } from "~/lib/responses";

export const loader = async () => {
  return StandardResponse.notFound("Not Found");
}

export default function NotFound() {
  return <h1 className="text-9xl text-center">404</h1>;
}