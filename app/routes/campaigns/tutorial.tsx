import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Tutorial() {
  return (
    <div className="h-full w-full">
      <div className="relative mx-auto flex w-full items-center justify-center">
        <div className="fixed left-0 top-28 m-4 w-1/4 rounded-lg border border-gray-300 bg-white px-2 py-4">
          <div className="flex flex-col space-y-2">
            <h2 className="font-bold">Navigation Menu</h2>
            <a href="#create-step-1" className="hover:text-green-100">
              Step 1: Select Campaigns Tab
            </a>
            <a href="#create-step-2" className="hover:text-green-100">
              Step 2: Click Create Button{" "}
            </a>
            <a href="#create-step-3" className="hover:text-green-100">
              Step 3: Define Area of Interest{" "}
            </a>
            <a href="#create-step-4" className="hover:text-green-100">
              Step 4: Fill out Form{" "}
            </a>
            <a href="#create-step-5" className="hover:text-green-100">
              Step 5: Review your campaign{" "}
            </a>
          </div>
        </div>

        <Tabs defaultValue="create" className="w-1/3">
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
                    <img src="/img/contribute.png" alt="explore campaigns" />
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
                    <h2 className="text-lg font-bold" id="create-step-1">
                      Step 1
                    </h2>
                    <p className="my-4">
                      On the landing page, select the campaigns tab in the
                      top-right corner.
                    </p>
                    <img src="/img/landingPage.png" alt="explore campaigns" />
                  </div>
                </li>
                <li>
                  <div>
                    <h2 className="text-lg font-bold" id="create-step-2">
                      Step 2
                    </h2>
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
                    <h2 className="text-lg font-bold" id="create-step-3">
                      Step 3
                    </h2>
                    <p className="my-4">
                      The first step to create a campaign is to define its
                      geographical area. To do so, you have the following two
                      options:
                    </p>
                    <h3 className="font-bold">Option 1: Draw on the map</h3>
                    <p className="my-4">
                      Use the draw controls on the map to create different
                      geometrical shapes on the map to define in which area your
                      campaign takes place. You can choose between a polygon, a
                      circle and a rectangle.
                    </p>
                    <img
                      src="/img/draw_area_tutorial.png"
                      alt="draw area of interest for your campaign"
                    />
                    <h3 className="font-bold">Option 2: Import a file</h3>
                    <p className="my-4">
                      If you have the geographical data for your campaign
                      already available, you can import it here. The imported
                      file has to contain valid geojson data. Therefore, it has
                      to have an extension of .geojson or .json. If you have the
                      geographical data in another format, please consider using
                      tools like QGIS to transform it into a geojson file.
                    </p>
                    <img
                      src="/img/upload_data_tutorial.png"
                      alt="upload geojson data from a file to define the area of your campaign"
                    />
                  </div>
                </li>
                <li>
                  <div>
                    <h2 className="text-lg font-bold" id="create-step-4">
                      Step 4
                    </h2>
                    <p className="my-4">
                      Fill out the form to provide information about your
                      campaign
                    </p>
                    <img src="/img/form_tutorial.png" alt="fill out form" />
                  </div>
                </li>
                <li>
                  <div>
                    <h2 className="text-lg font-bold" id="create-step-5">
                      Step 5
                    </h2>
                    <p className="my-4">
                      On the explorer click on your newly created campaign.
                    </p>
                    <img
                      src="/img/new_campaign_tutorial.png"
                      alt="click on your new campaign after being redirected to the explore view"
                    />
                    <p className="my-4">
                      Now you can review your new campaign and edit it if
                      needed.
                    </p>
                    <img
                      src="/img/slug_tutorial.png"
                      alt="review and edit your campaign"
                    />
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
