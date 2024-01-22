import { Form } from "@remix-run/react";
import { ReplyIcon } from "lucide-react";
import Markdown from "markdown-to-jsx";
import { useEffect, useRef, useState } from "react";
import { ClientOnly } from "remix-utils";
import { Button } from "~/components/ui/button";
import { MarkdownEditor } from "~/markdown.client";
import { Comment, Post } from "~/schema";
import { Separator } from "~/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { format } from "date-fns";
import Tribute from "tributejs";
import {
  CommentWithUser,
  PostWithAuthorAndComments,
} from "~/schema/drizzle-helper";

type Props = {
  posts: PostWithAuthorAndComments[];
  participants: any[];
};

interface ShowComments {
  [postId: string]: boolean;
}

export default function ListPosts({ posts, participants }: Props) {
  const replyRef = useRef();
  const isBundle = useRef(false);
  const [reply, setReply] = useState<string | undefined>("");
  const initialState: ShowComments = posts.reduce((acc: ShowComments, post) => {
    acc[post.id] = false;
    return acc;
  }, {});
  const [showComments, setShowComments] = useState<ShowComments>(initialState);

  useEffect(() => {
    if (replyRef.current && !isBundle.current && Array.isArray(participants)) {
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
      isBundle.current = true;
      //@ts-ignore
      tribute.attach(replyRef.current.textarea);
      //@ts-ignore
      replyRef.current.textarea.addEventListener("tribute-replaced", (e) => {
        setReply(e.target.value);
        // setMentions(e.detail.item.original.value);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replyRef.current]);

  function formatDate(date: Date): string {
    return format(new Date(date), "dd/MM/yyyy");
  }

  function formatTime(date: Date): string {
    return format(new Date(date), "HH:mm");
  }

  const handleReplyClick = (postId: string) => {
    setShowComments((prevShowComments) => ({
      ...prevShowComments,
      [postId]: !prevShowComments[postId],
    }));
  };

  let prevCreatedAt: undefined | string = undefined;
  return (
    <>
      <h1 className="mb-4 mt-6 font-bold">Discussion</h1>
      <ul className="w-full">
        {posts.map((p) => {
          const { createdAt } = p;
          const date = formatDate(createdAt);
          const showPostDate = date !== prevCreatedAt;
          prevCreatedAt = date;
          const number_of_comments = p.comment.length;
          return (
            <>
              {showPostDate && (
                <div className="mt-2 w-full">
                  <span>{date}</span>
                  <Separator className=" my-2 p-0.5" />
                </div>
              )}

              <li
                className="border-gray m-2 flex w-full flex-col border-2 p-2"
                key={p.id}
              >
                <div className="mb-4 flex w-3/4 items-center justify-between p-2">
                  <div className="flex flex-col">
                    <div className="flex">
                      <Avatar className="hover:cursor-pointer">
                        <AvatarImage src="" alt="avatar" />
                        <AvatarFallback>
                          {p.author.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-6 flex flex-col">
                        <span>{p.author.name}</span>
                        <span>{formatTime(p.createdAt)}</span>
                      </div>
                    </div>
                    <Markdown>{p.content}</Markdown>
                  </div>
                </div>
              </li>
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
                      formatDate(p.comment[number_of_comments - 1].createdAt)}
                  </span>
                </div>
              )}
              {showComments[p.id] && (
                <>
                  <ul>
                    {p.comment &&
                      p.comment.map((c: CommentWithUser) => {
                        return (
                          <li
                            className="border-gray m-2 flex w-full flex-col border-2 p-2"
                            key={c.id}
                          >
                            <div className="mb-4 flex w-3/4 items-center justify-between p-2">
                              <div className="flex flex-col">
                                <div className="flex">
                                  <Avatar className="hover:cursor-pointer">
                                    <AvatarImage src="" alt="avatar" />
                                    <AvatarFallback>
                                      {c.user.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="ml-6 flex flex-col">
                                    <span>{c.user.name}</span>
                                    <span>{formatTime(c.createdAt)}</span>
                                  </div>
                                </div>
                                <Markdown>{c.content}</Markdown>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                  <ClientOnly>
                    {() => (
                      <div className="container mt-4 overflow-auto">
                        <MarkdownEditor
                          textAreaRef={replyRef}
                          comment={reply}
                          setComment={setReply}
                          placeholder="Reply to this thread..."
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
            </>
          );
        })}
      </ul>
    </>
  );
}
