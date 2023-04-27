import { LoaderArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import clsx from "clsx";

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
      {data.data.stream.length === 0 ? (
        <div>
          Zurzeit gibt es noch keine Kampagnen. Klicke hier um eine Kampagne zu
          erstellen
        </div>
      ) : (
        data.data.stream.map((item: any) => (
          <div
            key={item.id}
            className="relative mb-4 rounded-lg bg-white p-4 shadow-md"
          >
            <div className="absolute top-0 right-0 m-2 flex justify-end">
              <div
                className={clsx(
                  "rounded-md px-2 py-1 text-xs font-medium text-white",
                  {
                    "bg-red-500": item.priority.toLowerCase() === "urgent",
                    "bg-yellow-500": item.priority.toLowerCase() === "high",
                    "bg-blue-500": item.priority.toLowerCase() === "medium",
                    "bg-green-500": item.priority.toLowerCase() === "low",
                  }
                )}
              >
                {item.priority}
              </div>
            </div>
            <h2 className="mb-2 text-lg font-medium">{item.title}</h2>
            <p className="text-gray-600">{item.description}</p>
            <a href="#" className="text-blue-600 hover:text-blue-800">
              Learn More
            </a>
          </div>
        ))
      )}
    </div>
  );
}
