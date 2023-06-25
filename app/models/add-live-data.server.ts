import { prisma } from "~/db.server";
import type { Prisma } from "@prisma/client";
import fetch from "node-fetch";
//data for testing TODO: retrieve from API
// let jsonData = require("./data/boxes_full.json");
let count = 0;

export async function addLiveData() {
  try {
    console.log("requesting", "https://api.opensensemap.org/boxes?full=true");
    const response = await fetch(
      "https://api.opensensemap.org/boxes?full=true"
    );
    const json: any = await response.json();
    console.log(json);
    json.forEach((item: any) => {
      item.sensors.forEach((sensor: any) => {
        // console.log(sensor)
        if (sensor.lastMeasurement && sensor._id) {
          updateSensor(sensor._id, sensor.lastMeasurement);
        }
      });
    });
  } catch (error: any) {
    console.log(error.response.body);
  }

  // IF YOU WANT TO TEST THIS WITHOUT QUERING OSEM DB
  // jsonData.forEach((item:any) => {
  //     item.sensors.forEach((sensor:any) => {
  //         // console.log(sensor)
  //         if(sensor.lastMeasurement && sensor._id){
  //             updateSensor(sensor._id, sensor.lastMeasurement);
  //         }
  //     })
  // })
}

export async function updateSensor(id: string, lastMeasurement: any) {
  const sensor = await prisma.sensor.findFirst({
    where: {
      id: id,
    },
  });
  if (sensor) {
    const sensorUpdated = await prisma.sensor.update({
      where: {
        id: id,
      },
      data: {
        lastMeasurement: lastMeasurement as Prisma.JsonObject,
      },
    });
    count++;
    console.log("UPDATED", count);
  }
}
