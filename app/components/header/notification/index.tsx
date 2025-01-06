import {
  NovuProvider,
  PopoverNotificationCenter,
  NotificationBell,
} from "@novu/notification-center";
import type { IMessage } from "@novu/notification-center";
import { useLoaderData } from "react-router";
import type { loader } from "~/root";

function onNotificationClick(message: IMessage) {
  if (message?.cta?.data?.url) {
    //window.location.href = message.cta.data.url;
    window.open(message.cta.data.url, "_blank");
  }
}

export default function Notification() {
  const data = useLoaderData<typeof loader>();
  // get theme from tailwind
  const [theme] = "light" //useTheme();
  return (
    <div className="pointer-events-auto mr-4 box-border flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white text-black hover:bg-gray-100">
      <NovuProvider
        backendUrl={""}
        socketUrl={""}
        subscriberId={data?.user?.id}
        applicationIdentifier={""}
        //i18n={{}}
      >
        <PopoverNotificationCenter
          colorScheme={theme === "dark" ? "dark" : "light"}
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
