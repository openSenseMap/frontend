import {
  NovuProvider,
  PopoverNotificationCenter,
  NotificationBell,
  useUpdateAction,
  MessageActionStatusEnum,
  useRemoveNotification,
} from "@novu/notification-center";
import type { ButtonTypeEnum, IMessage } from "@novu/notification-center";
import { useLoaderData } from "@remix-run/react";
import type { loader } from "~/root";
import { styles } from "./styles";
import { useToast } from "~/components/ui/use-toast";
import { useNavigate } from "@remix-run/react";

function PopoverWrapper() {
  const { updateAction } = useUpdateAction();
  const { removeNotification } = useRemoveNotification();
  const { toast } = useToast();
  const navigate = useNavigate();

  function handlerOnNotificationClick(message: IMessage) {
    if (message?.cta?.data?.url) {
      window.location.href = message.cta.data.url;
    }
  }

  async function handlerOnActionClick(
    templateIdentifier: string,
    type: ButtonTypeEnum,
    message: IMessage
  ) {
    if (templateIdentifier === "new-participant") {
      await updateAction({
        messageId: message._id,
        actionButtonType: type,
        status: MessageActionStatusEnum.DONE,
      });

      await removeNotification({
        messageId: message._id,
      });
      if (type === "primary") {
        toast({ title: "Participant accepted successfully!" });
        // navigate("../create/area");
      }
      if (type === "secondary") {
        toast({ title: "Participant rejected" });
      }
    }
  }

  return (
    <PopoverNotificationCenter
      onNotificationClick={handlerOnNotificationClick}
      onActionClick={handlerOnActionClick}
      colorScheme={"dark" || "light"}
    >
      {({ unseenCount }) => {
        return <NotificationBell unseenCount={unseenCount} />;
      }}
    </PopoverNotificationCenter>
  );
}

export default function Notification() {
  const data = useLoaderData<typeof loader>();
  if (!data.user) {
    return null;
  }

  return (
    <div className="pointer-events-auto mr-4 box-border flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white text-black hover:bg-gray-100">
      <NovuProvider
        // backendUrl={ENV.NOVU_API_URL}
        // socketUrl={ENV.NOVU_WEBSOCKET_URL}
        subscriberId={data.user.id}
        applicationIdentifier={"EPejtk10iLv7"}
        styles={styles}
        //i18n={{}}
      >
        <PopoverWrapper />
      </NovuProvider>
    </div>
  );
}
