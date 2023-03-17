import { useState } from "react";

export default function Tools() {
  const tools = [
    {
      name: "Tool 1",
      video: "/landing/stock_video.mp4",
      id: 1,
    },
    {
      name: "Tool 2",
      video: "/landing/stock_video.mp4",
      id: 2,
    },
    {
      name: "Tool 3",
      video: "/landing/stock_video.mp4",
      id: 3,
    },
    {
      name: "Tool 4",
      video: "/landing/stock_video.mp4",
      id: 4,
    },
    {
      name: "Tool 5",
      video: "/landing/stock_video.mp4",
      id: 5,
    },
    {
      name: "Tool 6",
      video: "/landing/stock_video.mp4",
      id: 6,
    },
    {
      name: "Tool 7",
      video: "/landing/stock_video.mp4",
      id: 7,
    },
    {
      name: "Tool 8",
      video: "/landing/stock_video.mp4",
      id: 8,
    },
    {
      name: "Tool 9",
      video: "/landing/stock_video.mp4",
      id: 9,
    },
  ];
  const [selectedTool, setSelectedTool] = useState(tools[0]);
  return (
    <div className="flex h-full min-h-full items-center justify-center">
      <div className="flex w-5/6 flex-col">
        <div className="flex items-center justify-center pb-10">
          <p className="font-serif text-6xl font-black text-blue-100 dark:text-blue-200 subpixel-antialiased">
            Tools
          </p>
        </div>
        <div className="flex items-center justify-around py-8">
          {tools.map((tool) => {
            return (
              <div
                key={tool.id}
                onClick={() => {
                  setSelectedTool(tool);
                }}
                className={
                  "flex cursor-pointer items-center rounded-lg border-l-4 border-t-4 border-b-8 border-r-8 border-solid border-blue-100 dark:border-blue-200 dark:bg-blue-200 py-2 px-4 font-serif font-extrabold hover:border-l-2 hover:border-t-2 hover:border-b-4 hover:border-r-4 " +
                  (selectedTool.id === tool.id
                    ? "bg-blue-100 text-white"
                    : "text-blue-500")
                }
              >
                <p>{tool.name}</p>
              </div>
            );
          })}
        </div>
        <div className="flex h-full items-center justify-center">
          <video
            autoPlay
            className="h-full w-auto min-w-full rounded-lg border-solid border-blue-100 border-8 dark:border-blue-200 object-contain"
          >
            <source src={selectedTool.video} type="video/mp4"></source>
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
}
