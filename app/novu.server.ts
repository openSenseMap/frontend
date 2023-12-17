import { Novu } from "@novu/node";
import { getEnv } from "./env.server";
import * as fs from "fs";
import path from "path";

const novu = new Novu(getEnv().NOVU_API_KEY ?? "");

export const deleteMessageById = async function deleteMessageById(
  messageId: string
) {
  const messageToDelete = await novu.messages.deleteById(messageId);
  console.log(messageToDelete);
};

export const triggerNotificationNewParticipant =
  async function triggerNotificationNewParticipant(
    subscriberId: string,
    email: string,
    name: string,
    campaignTitle?: string
  ) {
    const notif = await novu.trigger("new-participant", {
      to: {
        subscriberId: subscriberId,
      },
      payload: {
        campaign: { title: campaignTitle },
        participant: { email: email, name: name },
      },
    });
  };

export const campaignCancelled = async function campaignCancelled(
  subscriberId: string,
  campaignTitle: string
) {
  const notif = await novu.trigger("campaign-cancelled", {
    to: {
      subscriberId: subscriberId,
    },
    payload: {
      campaign: { title: campaignTitle },
    },
  });
};

export const requestReceived = async function requestReceived(
  subscriberId: string
) {
  const notif = await novu.trigger("request-received", {
    to: {
      subscriberId: subscriberId,
    },
    payload: {},
  });
};

export const supportRequested = async function supportRequested(
  subscriberId: string,
  username: string,
  description: string,
  detailed_description: string,
  browsers: any[]
) {
  const notif = await novu.trigger("support-requested", {
    to: {
      subscriberId: subscriberId,
    },
    payload: {
      attachments: [
        {
          file: fs.readFileSync(
            path.join(__dirname, "../public/problem_screenshot.png")
          ),
          name: "problem_screenshot.jpeg",
          mime: "image/jpg",
        },
      ],
      username: username,
      form: {
        description: description,
        detailed_description: detailed_description,
        browsers: browsers,
      },
    },
  });
  // const notif = novu.trigger("support-requested", {
  //   to: {
  //     subscriberId: subscriberId,
  //   },
  //   payload: {
  //     // attachments: [
  //     //   {
  //     //     file: fs.readFileSync(__dirname + '/data/test.jpeg'),
  //     //     name: 'test.jpeg',
  //     //     mime: 'image/jpg',
  //     //   },
  //     // ],
  //   },
  //   overrides: {
  //     email: {
  //       to: ["gerspammer@gmail.com"],
  //       from: "from@novu.co",
  //       senderName: "Novu Team",
  //       text: "text version of email",
  //       replyTo: "no-reply@novu.co",
  //       // cc: ["1@novu.co"],
  //       // bcc: ["2@novu.co"],
  //       integrationIdentifier: "send",
  //     },
  //   },
  // });
};

export const mentionedUser = async function mentionedUser(
  subscriberId: string,
  mentionedBy: string,
  slug: string
) {
  const notif = await novu.trigger("mentioned-user", {
    to: {
      subscriberId: subscriberId,
    },
    payload: {
      message: { mentionedBy: mentionedBy },
      campaign: { slug: slug },
    },
  });
};

export const createNewSubscriber = async function createNewSubscriber(
  id: string,
  email?: string,
  name?: string
) {
  await novu.subscribers.identify(id, {
    email: email,
    firstName: name,
  });
};
