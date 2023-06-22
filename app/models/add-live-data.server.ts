import { prisma } from "~/db.server";
import type { Prisma } from "@prisma/client";

//data for testing TODO: retrieve from API
let jsonData = require('./data/boxes_full.json');
let count = 0;


export async function addLiveData() {
    
    jsonData.forEach((item:any) => {
        item.sensors.forEach((sensor:any) => {
            // console.log(sensor)
            if(sensor.lastMeasurement && sensor._id){
                updateSensor(sensor._id, sensor.lastMeasurement);
            }
        })
    })
}
  

export async function updateSensor(id:string, lastMeasurement:any) {
    const sensor = await prisma.sensor.findFirst({
        where: {
            id: id
        }
    })
    if(sensor){
        const sensorUpdated = await prisma.sensor.update(
            {where: {
                id: id
              },
              data: {
                lastMeasurement : lastMeasurement as Prisma.JsonObject
              }
            } 
        ) 
        count++
        console.log("UPDATED", count)    
    }
}