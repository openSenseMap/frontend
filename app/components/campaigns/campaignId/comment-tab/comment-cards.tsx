import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { TrashIcon, EditIcon } from "lucide-react";
import { ClientOnly } from "remix-utils";
import { MarkdownEditor } from "~/markdown.client";
import Markdown from "markdown-to-jsx";
// import type { Comment } from "@prisma/client";
import type { Comment } from "~/schema";

type CommentCardsProps = {
  comments: any;
  userId: string;
  setCommentEditMode: (e: boolean) => void;
  setEditCommentId: (e: string | undefined) => void;
  setEditComment: (e: string | undefined) => void;
  commentEditMode: boolean;
  textAreaRef: any;
  editComment: string;
};

export default function CommentCards({
  comments,
  userId,
  setCommentEditMode,
  setEditComment,
  setEditCommentId,
  textAreaRef,
  commentEditMode,
  editComment,
}: CommentCardsProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {comments.map((c: Comment, i: number) => {
        return (
          <div
            key={i}
            // className="flex flex-col items-center justify-center gap-4"
          >
            <Card className="w-fit min-w-[300px]">
              <CardHeader>
                <CardTitle className="flex flex-wrap justify-between">
                  <div className="flex items-center gap-2 pb-4">
                    <Avatar>
                      <AvatarImage src="" alt="avatar" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    {/* @ts-ignore */}
                    {c.owner.name}
                  </div>
                  {userId === c.userId && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCommentEditMode(true);
                          setEditCommentId(c.id);
                          setEditComment(c.content);
                        }}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Form method="post">
                        <input
                          className="hidden"
                          id="deleteComment"
                          name="deleteComment"
                          type="text"
                          value={c.id}
                        />
                        <Button
                          variant="outline"
                          name="_action"
                          value="DELETE"
                          type="submit"
                        >
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </Form>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col">
                {commentEditMode ? (
                  <ClientOnly>
                    {() => (
                      <div className="container mt-4 overflow-auto">
                        <MarkdownEditor
                          textAreaRef={textAreaRef}
                          comment={editComment}
                          setComment={setEditComment}
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
                          <input
                            className="hidden"
                            value={c.id}
                            name="commentId"
                            id="commentId"
                          />
                          <textarea
                            className="hidden"
                            value={editComment}
                            name="editComment"
                            id="editComment"
                          ></textarea>
                          <Button
                            name="_action"
                            value="EDIT"
                            type="submit"
                            className="float-right mt-2"
                          >
                            Veröffentlichen
                          </Button>
                        </Form>
                      </div>
                    )}
                  </ClientOnly>
                ) : (
                  <Markdown>{c.content}</Markdown>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
