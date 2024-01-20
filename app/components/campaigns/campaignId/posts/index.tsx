import { Form } from "@remix-run/react";
import { ReplyIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Comment, Post } from "~/schema";

type Props = {
  posts: Post[];
};

interface ShowComments {
  [postId: string]: boolean;
}

export default function ListPosts({ posts }: Props) {
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
              <li className="flex w-full justify-between" key={p.id}>
                <span>{p.content}</span>
                <Form method="post">
                  <input
                    className="hidden"
                    value={p.id}
                    name="postId"
                    id="postId"
                  />
                </Form>
              </li>
              {p.comment && p.comment.length > 0 && (
                <Form method="post">
                  <input
                    className="hidden"
                    value={p.id}
                    name="postId"
                    id="postId"
                  />
                  <Button
                    variant="ghost"
                    className="flex gap-2"
                    type="submit"
                    name="_action"
                    value="GET_COMMENTS"
                    onClick={() => handleReplyClick(p.id)}
                  >
                    <ReplyIcon className="h-4 w-4" />
                    {p.comment.length} Replies
                  </Button>
                </Form>
              )}

              {/* {p.comment.length > 0 && <div>{p.comment.length} Replies</div>} */}
              {showComments[p.id] && (
                <>
                  {p.comment &&
                    p.comment.map((c: Comment) => {
                      return <span>{c.content}</span>;
                    })}
                  <Form method="post" className="w-full">
                    <input
                      className="hidden"
                      id="postId"
                      name="postId"
                      value={p.id}
                    />
                    <textarea name="content" id="content"></textarea>
                    <Button
                      className="bg-blue-700 text-white"
                      variant="outline"
                      type="submit"
                      name="_action"
                      value="PUBLISH"
                    >
                      Submit
                    </Button>
                  </Form>
                </>
              )}
            </>
          );
        })}
      </ul>
    </>
  );
}
