import { Form, useSearchParams } from "@remix-run/react";
import { Button } from "~/components/ui/button";

export default function SearchField() {
  const [searchParams] = useSearchParams();
  return (
    <Form>
      <input
        className="focus:ring-blue-400 mx-auto mt-5 w-1/3 rounded-md border border-gray-300 px-4 py-2 text-center text-lg focus:border-transparent focus:outline-none focus:ring-2"
        type="text"
        name="search"
        id="search"
        defaultValue={searchParams.get("search") || ""}
        placeholder="Search campaigns"
        // value={filterObject.searchTerm}
        // onChange={(event) =>
        //   setFilterObject({
        //     ...filterObject,
        //     searchTerm: event.target.value,
        //   })
        // }
      />
      <Button type="submit">Search </Button>
    </Form>
  );
}
