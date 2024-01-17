import { Form, useActionData } from "@remix-run/react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { action } from "~/routes/campaigns/$slug";
import { Comment, Post } from "~/schema";

type Props = {
  posts: Post[];
};

interface ShowReplyFields {
  [postId: string]: boolean;
}

export default function ListPosts({ posts }: Props) {
  const comments = useActionData<typeof action>();
  console.log(comments);
  const initialState: ShowReplyFields = posts.reduce(
    (acc: ShowReplyFields, post) => {
      acc[post.id] = false;
      return acc;
    },
    {}
  );

  const [showReplyFields, setShowReplyFields] =
    useState<ShowReplyFields>(initialState);

  const handleReplyClick = (postId: string) => {
    setShowReplyFields((prevShowReplyFields) => ({
      ...prevShowReplyFields,
      [postId]: !prevShowReplyFields[postId],
    }));
  };
  return (
    <ul className="w-full">
      {posts.map((p) => {
        return (
          <>
            <li className="flex w-full justify-between" key={p.id}>
              <span>{p.title}</span>
              <Form method="post">
                <input
                  className="hidden"
                  value={p.id}
                  name="postId"
                  id="postId"
                />
                <Button
                  className="bg-blue-700 text-white"
                  variant="outline"
                  type="submit"
                  name="_action"
                  value="GET_COMMENTS"
                  onClick={() => handleReplyClick(p.id)}
                >
                  Reply
                </Button>
              </Form>
            </li>
            {comments && (
              {comments.map(c => {
                <span>{c.id}</span>
              })}
            )}
            {/* {p.comment.length > 0 && <div>{p.comment.length} Replies</div>} */}
            {showReplyFields[p.id] && (
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
            )}
          </>
        );
      })}
    </ul>
  );
}
