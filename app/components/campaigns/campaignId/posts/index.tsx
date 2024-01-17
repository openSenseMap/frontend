import { Form } from "@remix-run/react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Post } from "~/schema";

type Props = {
  posts: Post[];
};

interface ShowReplyFields {
  [postId: string]: boolean;
}

export default function ListPosts({ posts }: Props) {
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
              <Button onClick={() => handleReplyClick(p.id)}>Reply</Button>
            </li>
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
