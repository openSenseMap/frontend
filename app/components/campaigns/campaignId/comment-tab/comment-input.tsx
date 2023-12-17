import { Form } from "@remix-run/react";
import { ClientOnly } from "remix-utils";
import { Button } from "~/components/ui/button";
import { MarkdownEditor } from "~/markdown.client";
import { useNavigate } from "@remix-run/react";
// import Tribute from "tributejs";
// import tributeStyles from "tributejs/tribute.css";
// import type { LinksFunction } from "@remix-run/node";
// import { useEffect } from "react";

// export const links: LinksFunction = () => {
//   return [{ rel: "stylesheet", href: tributeStyles }];
// };

type CommentInputProps = {
  textAreaRef: any;
  comment: string | undefined;
  setComment: any;
  setCommentEditMode: (editMode: boolean) => void;
  mentions?: string[];
};

export default function CommentInput({
  textAreaRef,
  comment,
  setComment,
  setCommentEditMode,
  mentions,
}: CommentInputProps) {
  const navigate = useNavigate();

  // useEffect(() => {
  //   if (textAreaRef.current) {
  //     var tribute = new Tribute({
  //       trigger: "@",
  //       values: [
  //         { key: "Phil Heartman", value: "pheartman" },
  //         { key: "Gordon Ramsey", value: "gramsey" },
  //       ],
  //       itemClass: "bg-blue-700 text-black",
  //     });
  //     tribute.attach(textAreaRef.current.textarea);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [textAreaRef.current]);

  return (
    <ClientOnly>
      {() => (
        <div className="container mt-4 overflow-auto">
          <MarkdownEditor
            textAreaRef={textAreaRef}
            comment={comment}
            setComment={setComment}
          />
          <div className="w-100 border-blue-grey relative flex justify-between rounded-b-lg border border-l border-r border-t-0 px-2 py-1 shadow-md">
            <span className="text-gray text-xs leading-4">Bild hinzufügen</span>
            <span className="text-gray text-xs leading-4">
              Markdown unterstützt
            </span>
          </div>
          <Form method="post">
            <textarea
              className="hidden"
              value={comment}
              onChange={setComment}
              name="comment"
              id="comment"
            ></textarea>
            <input
              className="hidden"
              value={JSON.stringify(mentions)}
              name="mentions"
              id="mentions"
            />
            <Button
              className="float-right mt-2"
              onClick={() => {
                setCommentEditMode(false);
                navigate(".", { replace: true });
              }}
              name="_action"
              value="PUBLISH"
              type="submit"
            >
              Veröffentlichen
            </Button>
          </Form>
        </div>
      )}
    </ClientOnly>
  );
}
