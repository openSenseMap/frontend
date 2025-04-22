/* eslint-disable @typescript-eslint/no-unused-vars */
import  { type FeatureCollection, type Point } from "geojson";
import mapboxglcss from "mapbox-gl/dist/mapbox-gl.css?url";
import { useState, useRef} from "react";
import  { type MapLayerMouseEvent, type MapRef, MapProvider, Layer, Source, Marker  } from "react-map-gl";
import {
  Outlet,
  useNavigate,
  useSearchParams,
  useLoaderData,
  useParams,
  type LoaderFunctionArgs, type LinksFunction 
} from "react-router";
import type Supercluster from "supercluster";
import ErrorMessage from "~/components/error-message";
import Header from "~/components/header";
import Map from "~/components/map";
import { phenomenonLayers, defaultLayer } from "~/components/map/layers";
import BoxMarker from "~/components/map/layers/cluster/box-marker";
import ClusterLayer from "~/components/map/layers/cluster/cluster-layer";
import Legend, { type LegendValue } from "~/components/map/legend";
import { getDevices, getDevicesWithSensors } from "~/models/device.server";
import { getMeasurement } from "~/models/measurement.server";
import { getProfileByUserId } from "~/models/profile.server";
import { getSensors } from "~/models/sensor.server";
import { type Device } from "~/schema";
import { getFilteredDevices } from "~/utils";
import { getUser, getUserSession } from "~/utils/session.server"



export async function action({request}:{request:Request}){

	// console.log("'Testing the action function'");
  const sensorIds:Array<string>=[]
  const measurements:Array<object>=[]
	const formdata = await request.formData();
  console.log(formdata);
  const deviceIds = (formdata.get('devices') as string).split(',');
  const format = formdata.get('format') as string
  const aggregate = formdata.get('aggregate') as string
  const includeFields = {
    title: formdata.get('title') === 'on',
    unit: formdata.get('unit') === 'on',
    value: formdata.get('value') === 'on',
    timestamp: formdata.get('timestamp') === 'on',
  }
  console.log("devices:",deviceIds);
  if(deviceIds.length>=50){
    return Response.json({error:"Too many devices selected. If you want huge amounts of data, please consider visiting our archive.",link:"https://archive.opensensemap.org/"})
  }
  for(const device of deviceIds){
    const sensors = await getSensors(device);
    // console.log(sensors);
    for (const sensor of sensors) {
      sensorIds.push(sensor.id);
      const measurement = await getMeasurement(sensor.id,aggregate);
      measurement.map((m:any)=>{
        m["title"] = sensor.title;
        m["unit"] = sensor.unit;
      })
      // console.log(measurement); 
      measurements.push(measurement);
    }
  }
  // console.log(measurements);
  
  let content = '';
  let contentType = 'text/plain';
  let fileName = 'measurements';
  let rows;
  let csvrows:any=[];
  let textrows:any=[];
  
  const formatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Berlin" // Adjust to your target timezone
  });

  if (format === 'csv') {
    contentType = 'text/csv';
    fileName += '.csv';
    
    // Generate CSV headers
    const headers = ['SensorId', includeFields.title?'Title':null, includeFields.value?'Value':null,includeFields.unit?'Unit':null,includeFields.timestamp?'Timestamp':null];
  
    // Generate CSV rows
        measurements.map((measure:any)=>{
          // console.log(measure);
           measure.map((m:any)=>{
              rows = [m.sensorId,includeFields.title?m.title:null,includeFields.value?m.value:null,includeFields.unit?m.unit:null,includeFields.timestamp?formatter.format(new Date(m.time)):null].join(',')
              csvrows.push(rows);
          })
          
        })
        // console.log(csvrows);
        const utf8BOM = '\uFEFF';
        content = utf8BOM + [headers.join(','), ...csvrows].join('\n');
        
  }
  else if (format === 'json') {
    contentType = 'application/json';
    fileName += '.json';
    
    // Create a properly filtered JSON structure based on includeFields
    const filteredMeasurements:any = [];
    
    measurements.forEach((measureGroup: any) => {
      const groupData:any = [];
      
      measureGroup.forEach((m: any) => {
        // Create an object with only the requested fields
        const filteredItem: any = {};
        
        // Always include sensorId as it's a key identifier
        filteredItem.sensorId = m.sensorId;
        
        // Add optional fields based on user selection
        if (includeFields.title) filteredItem.title = m.title;
        if (includeFields.value) filteredItem.value = m.value;
        if (includeFields.unit) filteredItem.unit = m.unit;
        if (includeFields.timestamp) filteredItem.timestamp = formatter.format(new Date(m.time));
        
        groupData.push(filteredItem);
      });
      
      if (groupData.length > 0) {
        filteredMeasurements.push(groupData);
      }
    });
    
    // Pretty-print the JSON with 2-space indentation
    content = JSON.stringify(filteredMeasurements, null, 2);
  } 
  else { // txt format
    fileName += '.txt';
    contentType = 'text/plain';
    measurements.map((measure:any)=>{
        measure.map((m:any)=>{
            rows = `Title: ${m.title}\nSensorId: ${m.sensorId}\nValue: ${m.value}\nUnit: ${m.unit}\nTimestamp: ${formatter.format(new Date(m.time))}\n`
            textrows.push(rows)
        })
    })
    content = textrows.join('\n');
    
  }

  console.log(content);
  console.log(fileName);
  console.log(new Blob([content]).size / (1024 * 1024));
  return Response.json({
    href: `data:${contentType};charset=utf-8,${encodeURIComponent(content)}`,
    download: fileName
  });
}


export type DeviceClusterProperties =
  | Supercluster.PointFeature<any>
  | Supercluster.PointFeature<
      Supercluster.ClusterProperties & {
        categories: {
          [x: number]: number;
        };
      }
    >;

export async function loader({ request }: LoaderFunctionArgs) {
  //* Get filter params
  const url = new URL(request.url);
  const filterParams = url.search;
  const urlFilterParams = new URLSearchParams(url.search);

  // check if sensors are queried - if not get devices only to reduce load
  const devices = !urlFilterParams.get("phenomenon")
    ? await getDevices()
    : await getDevicesWithSensors();

  const session = await getUserSession(request);
  const message = session.get("global_message") || null;

  var filteredDevices = getFilteredDevices(devices, urlFilterParams);

  const user = await getUser(request);
  //const phenomena = await getPhenomena();

  if (user) {
    const profile = await getProfileByUserId(user.id);
    return {
      devices,
      user,
      profile,
      filteredDevices,
      filterParams,
      //phenomena
    };
  }
  return {
    devices,
    user,
    profile: null,
    filterParams,
    filteredDevices,
    message,
    //phenomena,
  };
}

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: mapboxglcss,
    },
  ];
};

// This is for the live data display. The 21-06-2023 works with the seed Data, for Production take now minus 10 minutes
let currentDate = new Date("2023-06-21T14:13:11.024Z");
if (process.env.NODE_ENV === "production") {
  currentDate = new Date(Date.now() - 1000 * 600);
}

export default function Explore() {
  // data from our loader
  const { devices, user, profile, filterParams, filteredDevices, message } =
    useLoaderData<typeof loader>();

  const mapRef = useRef<MapRef | null>(null);

  // get map bounds
  const [, setViewState] = useState({
    longitude: 7.628202,
    latitude: 51.961563,
    zoom: 2,
  });
  const navigate = useNavigate();
  // const [showSearch, setShowSearch] = useState<boolean>(false);
  const [selectedPheno, setSelectedPheno] = useState<any | undefined>(
    undefined,
  );
  const [searchParams] = useSearchParams();
  const [filteredData, setFilteredData] = useState<
    GeoJSON.FeatureCollection<Point, any>
  >({
    type: "FeatureCollection",
    features: [],
  });

  //listen to search params change
  // useEffect(() => {
  //   //filters devices for pheno
  //   if (searchParams.has("mapPheno") && searchParams.get("mapPheno") != "all") {
  //     let sensorsFiltered: any = [];
  //     let currentParam = searchParams.get("mapPheno");
  //     //check if pheno exists in sensor-wiki data
  //     let pheno = data.phenomena.filter(
  //       (pheno: any) => pheno.slug == currentParam?.toString(),
  //     );
  //     if (pheno[0]) {
  //       setSelectedPheno(pheno[0]);
  //       data.devices.features.forEach((device: any) => {
  //         device.properties.sensors.forEach((sensor: Sensor) => {
  //           if (
  //             sensor.sensorWikiPhenomenon == currentParam &&
  //             sensor.lastMeasurement
  //           ) {
  //             const lastMeasurementDate = new Date(
  //               //@ts-ignore
  //               sensor.lastMeasurement.createdAt,
  //             );
  //             //take only measurements in the last 10mins
  //             //@ts-ignore
  //             if (currentDate < lastMeasurementDate) {
  //               sensorsFiltered.push({
  //                 ...device,
  //                 properties: {
  //                   ...device.properties,
  //                   sensor: {
  //                     ...sensor,
  //                     lastMeasurement: {
  //                       //@ts-ignore
  //                       value: parseFloat(sensor.lastMeasurement.value),
  //                       //@ts-ignore
  //                       createdAt: sensor.lastMeasurement.createdAt,
  //                     },
  //                   },
  //                 },
  //               });
  //             }
  //           }
  //         });
  //         return false;
  //       });
  //       setFilteredData({
  //         type: "FeatureCollection",
  //         features: sensorsFiltered,
  //       });
  //     }
  //   } else {
  //     setSelectedPheno(undefined);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [searchParams]);

  function calculateLabelPositions(length: number): string[] {
    const positions: string[] = [];
    for (let i = length - 1; i >= 0; i--) {
      const position =
        i === length - 1 ? "95%" : `${((i / (length - 1)) * 100).toFixed(0)}%`;
      positions.push(position);
    }
    return positions;
  }

  const legendLabels = () => {
    const values =
      //@ts-ignore
      phenomenonLayers[selectedPheno.slug].paint["circle-color"].slice(3);
    const numbers = values.filter(
      (v: number | string) => typeof v === "number",
    );
    const colors = values.filter((v: number | string) => typeof v === "string");
    const positions = calculateLabelPositions(numbers.length);

    const legend: LegendValue[] = [];
    const length = numbers.length;
    for (let i = 0; i < length; i++) {
      const legendObj: LegendValue = {
        value: numbers[i],
        color: colors[i],
        position: positions[i],
      };
      legend.push(legendObj);
    }
    return legend;
  };

  // // /**
  // //  * Focus the search input when the search overlay is displayed
  // //  */
  // // const focusSearchInput = () => {
  // //   searchRef.current?.focus();
  // // };

  // /**
  //  * Display the search overlay when the ctrl + k key combination is pressed
  //  */
  // useHotkeys([
  //   [
  //     "ctrl+K",
  //     () => {
  //       setShowSearch(!showSearch);
  //       setTimeout(() => {
  //         focusSearchInput();
  //       }, 100);
  //     },
  //   ],
  // ]);

  const onMapClick = (e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];

      if (feature.layer.id === "phenomenon-layer") {
        void navigate(
          `/explore/${feature.properties?.id}?${searchParams.toString()}`,
        );
      }
    }
  };

  const handleMouseMove = (e: mapboxgl.MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      mapRef!.current!.getCanvas().style.cursor = "pointer";
    } else {
      mapRef!.current!.getCanvas().style.cursor = "";
    }
  };

  //* fly to sensebox location when url inludes deviceId
  const { deviceId } = useParams();
  var deviceLoc: any;
  let selectedDevice: any;
  if (deviceId) {
    selectedDevice = devices.features.find(
      (device: any) => device.properties.id === deviceId,
    );
    deviceLoc = [
      selectedDevice?.properties.latitude,
      selectedDevice?.properties.longitude,
    ];
  }

  const buildLayerFromPheno = (selectedPheno: any) => {
    //TODO: ADD VALUES TO DEFAULTLAYER FROM selectedPheno.ROV or min/max from values.
    return defaultLayer;
  };

  return (
    <div className="h-full w-full">
      <MapProvider>
        <Header devices={devices} />
        {selectedPheno && (
          <Legend
            title={selectedPheno.label.item[0].text}
            values={legendLabels()}
          />
        )}
        <Map
          onMove={(evt) => setViewState(evt.viewState)}
          interactiveLayerIds={selectedPheno ? ["phenomenon-layer"] : []}
          onClick={onMapClick}
          onMouseMove={handleMouseMove}
          ref={mapRef}
          initialViewState={
            deviceId
              ? { latitude: deviceLoc[0], longitude: deviceLoc[1], zoom: 10 }
              : { latitude: 7, longitude: 52, zoom: 2 }
          }
        >
          {!selectedPheno && (
            <ClusterLayer
              devices={filteredDevices as FeatureCollection<Point, Device>}
            />
          )}
          {selectedPheno && (
            <Source
              id="osem-data"
              type="geojson"
              data={filteredData as FeatureCollection<Point, Device>}
              cluster={false}
            >
              <Layer
                {...(phenomenonLayers[selectedPheno.slug] ??
                  buildLayerFromPheno(selectedPheno))}
              />
            </Source>
          )}

          {/* Render BoxMarker for the selected device */}
          {selectedDevice && deviceId && (
            <Marker
              latitude={selectedDevice.properties.latitude}
              longitude={selectedDevice.properties.longitude}
            >
              <BoxMarker
                key={`device-${selectedDevice.properties.id}`}
                latitude={selectedDevice.properties.latitude}
                longitude={selectedDevice.properties.longitude}
                device={selectedDevice.properties as Device}
              />
            </Marker>
          )}

          {/* <ClusterLayer
              devices={filterOptionsOn ? GlobalFilteredDevices : data.devices}
            /> */}
          <Outlet /> 
        </Map>
      </MapProvider>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <ErrorMessage />
    </div>
  );
}
