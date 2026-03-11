// import { useEffect } from "react";
// import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
// import { getProfileByUserId } from "~/models/profile.server";
// import { getInitials, getUserImgSrc } from "~/utils/misc";
// import { requireUser } from "~/utils/session.server";

// export async function loader({ request }: LoaderArgs) {a
//   const user = await requireUser(request);
//   const profile = await getProfileByUserId(user.id);

//   if (!user || !profile) {
//     throw new Error();
//   }

//   return json({ user, profile });
// }

// export function UserAvatar() {
//   const fetcher = useFetcher<typeof loader>();

//   useEffect(() => {
//     if (fetcher.state === "idle" && fetcher.data == null) {
//       fetcher.load("/resources/user-avatar");
//     }
//   }, [fetcher]);

//   return (
//     <Avatar className="h-8 w-8">
//       <AvatarImage
//         src={getUserImgSrc(fetcher.data?.profile.imageId)}
//         alt={fetcher.data?.profile.username}
//       />
//       <AvatarFallback>
//         {getInitials(fetcher.data?.user.name ?? "")}
//       </AvatarFallback>
//     </Avatar>
//   );
// }
