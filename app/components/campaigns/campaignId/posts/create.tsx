import { Form } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { ClientOnly } from "remix-utils";
import Tribute from "tributejs";
import { Button } from "~/components/ui/button";
import { MarkdownEditor } from "~/markdown.client";

type Props = {
  loggedIn: boolean;
  participants: any[];
};

export default function CreateThread({ loggedIn, participants }: Props) {
  const [comment, setComment] = useState<undefined | string>("");
  const [mentions, setMentions] = useState<string[] | undefined>();
  const textAreaRef = useRef();
  const isBundle = useRef(false);

  const tribute = new Tribute({
    trigger: "@",
    values: participants.map((p) => {
      return { key: p.user.name, value: p.user.name };
    }),
    itemClass: "bg-blue-700 text-black",
    selectTemplate(participant) {
      return `<span data-insight-id="${participant.original.key}" contenteditable="false">@${participant.original.value}</span>`;
    },
  });

  useEffect(() => {
    if (
      textAreaRef.current &&
      !isBundle.current &&
      Array.isArray(participants)
    ) {
      isBundle.current = true;
      //@ts-ignore
      tribute.attach(textAreaRef.current.textarea);
      //@ts-ignore
      textAreaRef.current.textarea.addEventListener("tribute-replaced", (e) => {
        setComment(e.target.value);
        setMentions(e.detail.item.original.value);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textAreaRef.current]);

  if (loggedIn) {
    return (
      <Form method="post" className="mt-8 w-full">
        <span>Create new Thread</span>
        <div className="flex w-full justify-between">
          <ClientOnly>
            {() => (
              <div className="container mt-4 overflow-auto">
                <MarkdownEditor
                  textAreaRef={textAreaRef}
                  comment={comment}
                  setComment={setComment}
                />
                <div className="w-100 border-blue-grey relative flex justify-between rounded-b-lg border border-l border-r border-t-0 px-2 py-1 shadow-md">
                  <span className="text-gray text-xs leading-4">
                    Bild hinzufügen
                  </span>
                  <span className="text-gray text-xs leading-4">
                    Markdown unterstützt
                  </span>
                </div>
                <Form method="post">
                  {/* <input
                          className="hidden"
                          value={c.id}
                          name="commentId"
                          id="commentId"
                        /> */}
                  <textarea
                    className="hidden"
                    value={comment}
                    name="content"
                    id="content"
                  ></textarea>
                  <Button
                    name="_action"
                    value="CREATE_POST"
                    type="submit"
                    className="float-right mt-2 bg-blue-700 text-white"
                  >
                    Veröffentlichen
                  </Button>
                </Form>
              </div>
            )}
          </ClientOnly>
          {/* <input type="text" name="content" id="content" ref={ref}></input> */}
          {/* <Button
            className="bg-blue-700 text-white"
            variant="outline"
            type="submit"
            name="_action"
            value="CREATE_POST"
          >
            Create
          </Button> */}
        </div>
      </Form>
    );
  } else {
    return <span>Login to create a Thread</span>;
  }
}
