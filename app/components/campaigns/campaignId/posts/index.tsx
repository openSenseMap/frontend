import { Form } from "@remix-run/react";
import { ReplyIcon } from "lucide-react";
import Markdown from "markdown-to-jsx";
import { useRef, useState } from "react";
import { ClientOnly } from "remix-utils";
import { Button } from "~/components/ui/button";
import { MarkdownEditor } from "~/markdown.client";
import { Comment, Post } from "~/schema";

type Props = {
  posts: Post[];
};

interface ShowComments {
  [postId: string]: boolean;
}

export default function ListPosts({ posts }: Props) {
  const replyRef = useRef();
  const [reply, setReply] = useState<string | undefined>("");

  const initialState: ShowComments = posts.reduce((acc: ShowComments, post) => {
    acc[post.id] = false;
    return acc;
  }, {});

  const [showComments, setShowComments] = useState<ShowComments>(initialState);

  const handleReplyClick = (postId: string) => {
    setShowComments((prevShowComments) => ({
      ...prevShowComments,
      [postId]: !prevShowComments[postId],
    }));
  };
  return (
    <>
      <h1 className="mt-6 font-bold">Discussion</h1>
      <ul className="w-full">
        {posts.map((p) => {
          const number_of_comments = p.comment.length;
          return (
            <>
              <li
                className="justify-conter flex w-full flex-col items-center p-4"
                key={p.id}
              >
                <div className="mb-4 flex w-3/4 items-center justify-between p-4">
                  <div className="flex flex-col">
                    <span>{p.createdAt?.toString().split("T")[0]}</span>
                    <span>{p.content}</span>

                    {p.comment && number_of_comments > 0 && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          className="flex gap-2"
                          onClick={() => handleReplyClick(p.id)}
                        >
                          <ReplyIcon className="h-4 w-4" />
                          {number_of_comments} Replies
                        </Button>
                        <span className="px-4 py-2 text-sm">
                          Last Reply:
                          {" " +
                            p.comment[number_of_comments - 1].createdAt
                              .toString()
                              .split("T")[0]}
                        </span>
                      </div>
                    )}
                    {showComments[p.id] && (
                      <>
                        {p.comment &&
                          p.comment.map((c: Comment) => {
                            return <Markdown>{c.content}</Markdown>;
                          })}
                        <ClientOnly>
                          {() => (
                            <div className="container mt-4 overflow-auto">
                              <MarkdownEditor
                                textAreaRef={replyRef}
                                comment={reply}
                                setComment={setReply}
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
                                  value={p.id}
                                  name="postId"
                                  id="postId"
                                />
                                <textarea
                                  className="hidden"
                                  value={reply}
                                  name="content"
                                  id="content"
                                ></textarea>
                                <Button
                                  name="_action"
                                  value="PUBLISH"
                                  type="submit"
                                  className="float-right mt-2 bg-blue-700 text-white"
                                >
                                  Veröffentlichen
                                </Button>
                              </Form>
                            </div>
                          )}
                        </ClientOnly>
                      </>
                    )}
                  </div>
                </div>
              </li>
            </>
          );
        })}
      </ul>
    </>
  );
}
