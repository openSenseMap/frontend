import type { LoaderArgs} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  getProfileByUserId,
} from "~/models/profile.server";

export const loader = async ({ params }: LoaderArgs) => {
    if (params.userId) {
        const profile = await getProfileByUserId(params.userId);
        if (profile) {
        return json({
            success: true,
            public: profile.public,
            username: profile.name,
        });
        }
    }
    return json({ success: false, username: null, public: false });
}
