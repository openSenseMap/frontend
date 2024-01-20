import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";

type Props = {
  loggedIn: boolean;
};

export default function CreateThread({ loggedIn }: Props) {
  if (loggedIn) {
    return (
      <Form method="post" className="mt-8 w-full">
        <span>Create new Thread</span>
        <div className="flex w-full justify-between">
          <input type="text" name="content" id="content"></input>
          <Button
            className="bg-blue-700 text-white"
            variant="outline"
            type="submit"
            name="_action"
            value="CREATE_POST"
          >
            Create
          </Button>
        </div>
      </Form>
    );
  } else {
    return <span>Login to create a Thread</span>;
  }
}
