import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

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
  ];
  return (
    <div
      id="tools"
      className="flex h-full min-h-full items-center justify-center"
    >
      <div className="flex w-full flex-col">
        <div className="flex items-center justify-center pb-10">
          <p className="dark:text-blue-200 font-serif text-6xl font-black text-blue-100 subpixel-antialiased">
            Tools
          </p>
        </div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{
            duration: 0.5,
            delay: 0.3,
          }}
          variants={{
            visible: { opacity: 1, y: 0 },
            hidden: { opacity: 0, y: 100 },
          }}
          className="flex w-full items-center justify-around py-4"
        >
          <Tabs defaultValue={tools[0].name} className="w-full">
            <div className="flex items-center justify-center pb-4">
              <TabsList>
                {tools.map((tool) => {
                  return (
                    <TabsTrigger value={tool.name} key={tool.id}>
                      {tool.name}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
            {tools.map((tool) => {
              return (
                <TabsContent value={tool.name} key={tool.id}>
                  <div className="flex h-full items-center justify-center">
                    <video
                      autoPlay
                      loop
                      className="dark:border-blue-200 h-full w-[80%] rounded-lg border-8 border-solid border-blue-100 object-contain"
                    >
                      <source src={tool.video} type="video/mp4"></source>
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
