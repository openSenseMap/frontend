import { Novu } from "@novu/node";

const novu = new Novu("cf5112fd46673c4928c48bc3d8915b64");

const hello = "HELLO";
export const triggerNotification = async function triggerNotification() {
  const notif = await novu.trigger("untitled-crmbk88zt", {
    to: {
      subscriberId: "64ac170290b5785d47096d3c	",
    },
    payload: { hello },
  });
  console.log(notif);
};
