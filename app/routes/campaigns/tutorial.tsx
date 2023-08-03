import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Tutorial() {
  return (
    <div className="h-full w-full">
      <div className="mx-auto flex w-full items-center justify-center">
        <Tabs defaultValue="contribute" className="w-1/2">
          <TabsList>
            <TabsTrigger value="contribute">Contribute</TabsTrigger>
            <TabsTrigger value="create">Create a Campaign</TabsTrigger>
          </TabsList>
          <TabsContent value="contribute">
            <div>
              <ol className="flex flex-col gap-4">
                <li>
                  <div>
                    <p>Step 1</p>
                    <img
                      src="/img/contribute.png"
                      alt="campaign overview page"
                    />
                  </div>
                </li>
                <li>
                  <div>
                    <p>Step 2</p>
                  </div>
                </li>
                <li>
                  <div>
                    <p>Step 3</p>
                  </div>
                </li>
              </ol>
            </div>
          </TabsContent>
          <TabsContent value="create">
            <div>
              <ol className="flex flex-col gap-6">
                <li>
                  <div>
                    <h2 className="text-lg font-bold">Step 1</h2>
                    <p className="my-4">
                      On the landing page, select the campaigns tab in the
                      top-right corner.
                    </p>
                    <img
                      src="/img/landingPage.png"
                      alt="campaign overview page"
                    />
                  </div>
                </li>
                <li>
                  <div>
                    <h2 className="text-lg font-bold">Step 2</h2>
                    <p className="my-4">
                      On the Info page click on the "Create"- Button in the
                      top-right corner
                    </p>
                    <img
                      src="/img/info.png"
                      alt="openSenseMap tasking manager info"
                    />
                  </div>
                </li>
                <li>
                  <div>
                    <h2 className="text-lg font-bold">Step 3</h2>
                    <p className="my-4">
                      The first step to create a campaign is to define its
                      geographical area. To do so, you have the following two
                      options:
                    </p>
                    <h3>Option 1: Draw on the map</h3>
                    <p>
                      Use the draw controls on the map to create different
                      geometrical shapes on the map to define in which area your
                      campaign takes place. You can choose between a polygon, a
                      circle and a rectangle.
                    </p>
                    <h3>Option 2: Import a file</h3>
                    <p>
                      If you have the geographical data for your campaign
                      already available, you can import it here. The imported
                      file has to contain valid geojson data. Therefore, it has
                      to have an extension of .geojson or .json. If you have the
                      geographical data in another format, please consider using
                      tools like QGIS to transform it into a geojson file.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
