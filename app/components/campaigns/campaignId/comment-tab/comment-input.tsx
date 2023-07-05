import { Form } from "@remix-run/react";
import { ClientOnly } from "remix-utils";
import { Button } from "~/components/ui/button";
import { MarkdownEditor } from "~/markdown.client";
import { useNavigate } from "@remix-run/react";

type CommentInputProps = {
  textAreaRef: any;
  comment: string | undefined;
  setComment: (comment: string | undefined) => void;
  setCommentEditMode: (editMode: boolean) => void;
};

export default function CommentInput({
  textAreaRef,
  comment,
  setComment,
  setCommentEditMode,
}: CommentInputProps) {
  const navigate = useNavigate();

  return (
    <ClientOnly>
      {() => (
        <div className="container overflow-auto">
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
              name="comment"
              id="comment"
            ></textarea>
            <Button
              className="float-right"
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
