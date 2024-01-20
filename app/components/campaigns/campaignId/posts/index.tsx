import { Form } from "@remix-run/react";
import { ReplyIcon } from "lucide-react";
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
          return (
            <>
              <li
                className="justify-conter flex w-full flex-col items-center p-4"
                key={p.id}
              >
                <div className="mb-4 flex w-3/4 items-center justify-between p-4">
                  <div className="flex flex-col">
                    <span>{p.content}</span>

                    {p.comment && p.comment.length > 0 && (
                      <Button
                        variant="ghost"
                        className="flex gap-2"
                        onClick={() => handleReplyClick(p.id)}
                      >
                        <ReplyIcon className="h-4 w-4" />
                        {p.comment.length} Replies
                      </Button>
                    )}
                    {showComments[p.id] && (
                      <>
                        {p.comment &&
                          p.comment.map((c: Comment) => {
                            return <span>{c.content}</span>;
                          })}
                        {/* <Form method="post" className="w-full">
                          <input
                            className="hidden"
                            id="postId"
                            name="postId"
                            value={p.id}
                          /> */}
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
                        {/* <textarea name="content" id="content"></textarea>
                          <Button
                            className="bg-blue-700 text-white"
                            variant="outline"
                            type="submit"
                            name="_action"
                            value="PUBLISH"
                          >
                            Submit
                          </Button>
                        </Form> */}
                      </>
                    )}
                  </div>
                </div>
              </li>

              {/* {p.comment.length > 0 && <div>{p.comment.length} Replies</div>} */}
            </>
          );
        })}
      </ul>
    </>
  );
}
