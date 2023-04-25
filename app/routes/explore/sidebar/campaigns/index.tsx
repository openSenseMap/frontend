import { LoaderArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader({ params }: LoaderArgs) {
  console.log(process.env.OSEM_API_URL);
  // request to API with deviceID
  const response = await fetch(process.env.OSEM_API_URL + "/users/campaigns/");
  const data = await response.json();
  if (data.code === "UnprocessableEntity") {
    throw new Response("Campaigns not found", { status: 502 });
  }
  return json(data);
}

export default function Campaigns() {
  const data = useLoaderData<typeof loader>();
  console.log(data);
  return (
    <div className="flex flex-col">
      {data.data.stream.map((item: any) => (
        <div key={item.id}>
          <h2>{item.title}</h2>
        </div>
      ))}
    </div>
  );
}
