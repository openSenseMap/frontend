import {
  NovuProvider,
  PopoverNotificationCenter,
  NotificationBell,
  IMessage,
} from "@novu/notification-center";
import { useLoaderData } from "@remix-run/react";
import { loader } from "~/root";

function onNotificationClick(message: IMessage) {
  // your logic to handle the notification click
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
        subscriberId={data?.user?.email}
        applicationIdentifier={"o5Ypz6hePA3V"}
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
          onUnseenCountChanged={(unseenCount) => {
            //unseen count changed
            console.log(unseenCount);
          }}
        >
          {({ unseenCount }) => <NotificationBell unseenCount={unseenCount} />}
        </PopoverNotificationCenter>
      </NovuProvider>
    </div>
  );
}
