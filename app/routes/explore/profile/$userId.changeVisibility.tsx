import type { LoaderArgs} from "@remix-run/node";
import { json } from "@remix-run/node";
import changeProfileVisibility from "~/models/profile.server";

export const action = async ({ params, request }: LoaderArgs) => {
  switch (request.method) {
    case "POST": {
      const payload = await request.json();
      if (params.userId) {
        const newProfile = await changeProfileVisibility(
          params.userId,
          payload.newVisibility
        );
        return json({
          success: true,
          newProfile: newProfile,
        });
      }
      return json({ success: false, newProfile: null });
    }
  }
};
