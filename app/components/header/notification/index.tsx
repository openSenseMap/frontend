import {
  NovuProvider,
  PopoverNotificationCenter,
  NotificationBell,
} from "@novu/notification-center";
import type { IMessage } from "@novu/notification-center";
import { useLoaderData } from "@remix-run/react";
import type { loader } from "~/root";
import { styles } from "./styles";

function onNotificationClick(message: IMessage) {
  if (message?.cta?.data?.url) {
    //window.location.href = message.cta.data.url;
    window.open(message.cta.data.url, "_blank");
  }
}

export default function Notification() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="pointer-events-auto mr-4 box-border flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white text-black hover:bg-gray-100">
      <NovuProvider
        // backendUrl={ENV.NOVU_API_URL}
        // socketUrl={ENV.NOVU_WEBSOCKET_URL}
        subscriberId={"64ac170290b5785d47096d3c"}
        applicationIdentifier={"EPejtk10iLv7"}
        styles={styles}
        //i18n={{}}
      >
        <PopoverNotificationCenter
          colorScheme="light"
          offset={8}
          showUserPreferences={false}
          onNotificationClick={onNotificationClick}
          header={() => {
            //header content here
            return <div></div>;
          }}
          footer={() => {
            //footer content here
            return <div></div>;
          }}
        >
          {({ unseenCount }) => <NotificationBell unseenCount={unseenCount} />}
        </PopoverNotificationCenter>
      </NovuProvider>
    </div>
  );
}
