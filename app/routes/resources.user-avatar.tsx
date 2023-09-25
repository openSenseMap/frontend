import type { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/node";
import { getProfileByUserId } from "~/models/profile.server";
import { requireUser } from "~/session.server";
import { useFetcher } from "@remix-run/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { getInitials, getUserImgSrc } from "~/utils/misc";
import { useEffect } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const profile = await getProfileByUserId(user.id);

  if (!user || !profile) {
    throw new Error();
  }

  return json({ user, profile });
}

export function UserAvatar() {
  const fetcher = useFetcher<typeof loader>();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data == null) {
      fetcher.load("/resources/user-avatar");
    }
  }, [fetcher]);

  return (
    <Avatar className="h-8 w-8">
      <AvatarImage
        src={getUserImgSrc(fetcher.data?.profile.imageId)}
        alt={fetcher.data?.profile.username}
      />
      <AvatarFallback>
        {getInitials(fetcher.data?.user.name ?? "")}
      </AvatarFallback>
    </Avatar>
  );
}
