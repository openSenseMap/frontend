import { Post } from "~/schema";

type Props = {
  posts: Post[];
};

export default function ListPosts({ posts }: Props) {
  return (
    <ul>
      {posts.map((p) => {
        return <li key={p.id}>{p.title}</li>;
      })}
    </ul>
  );
}
