import type { Prisma } from "@prisma/client";
import { PrismaClient, Status } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import csvtojson from "csvtojson";

const prisma = new PrismaClient();

function printProgress(text: string) {
  if (process.stdout.cursorTo) {
    process.stdout.cursorTo(0);
  }
  process.stdout.write(text);
}

const randomEnumValue = (enumeration: any) => {
  const values = Object.keys(enumeration);
  const enumKey = values[Math.floor(Math.random() * values.length)];
  return enumeration[enumKey];
};

const preparePasswordHash = function preparePasswordHash(
  plaintextPassword: string,
) {
  // first round: hash plaintextPassword with sha512
  const hash = crypto.createHash("sha512");
  hash.update(plaintextPassword.toString(), "utf8");
  const hashed = hash.digest("base64"); // base64 for more entropy than hex

  return hashed;
};

async function seed() {
  //* initial user data
  const email = "opensensemap@opensenselab.org";
  const hashedPassword = await bcrypt.hash(
    preparePasswordHash("osemrocks"),
    13,
  ); // make salt_factor configurable oSeM API uses 13 by default
  const dummyUser = {
    id: "cleqyv5pi00003uxdszv4mdnk", //* to connect it to imported data
    name: "YouQam",
    email: email,
    role: "user",
    language: "en_US",
    boxes: [],
    emailIsConfirmed: true,
    password: {
      create: {
        hash: hashedPassword,
      },
    },
  };

  //* cleanup the existing database (if any)
  await prisma.sensor.deleteMany({}).catch(() => {});
  await prisma.device.deleteMany({}).catch(() => {});
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });
  await prisma.measurement.deleteMany({}).catch(() => {});

  //* create intial user
  const user = await prisma.user.create({
    data: dummyUser,
  });

  // Create profile for initial user
  const profile = await prisma.profile.create({
    data: {
      username: "sensei",
      public: false,
      userId: dummyUser.id,
    },
  });
  console.log(
    `ℹ️  Create profile ${profile.username} 🥷🏼  for account with ${user.email}`,
  );

  // Import devices and connect it to user
  const devices = await csvtojson().fromFile("prisma/devices.csv");

  let i = 0;
  for await (const device of devices) {
    i++;
    await prisma.device.create({
      data: {
        id: device.id,
        userId: user.id,
        name: device.name,
        exposure: device.exposure,
        status: randomEnumValue(Status),
        useAuth: false,
        latitude: Number(device.latitude),
        longitude: Number(device.longitude),
      },
    });
    printProgress(`ℹ️  Imported ${i} of ${devices.length} devices.`);
  }
  process.stdout.write("\n");

  const sensors = await csvtojson().fromFile(
    "prisma/sensors_matched_sensors_pheno_units.csv",
  );

  let j = 0;
  for await (const sensor of sensors) {
    j++;
    await prisma.sensor.create({
      data: {
        id: sensor.id,
        deviceId: sensor.deviceId,
        title: sensor.title,
        sensorType: sensor.sensorType,
        unit: sensor.unit,
        sensorWikiType: sensor.sensorWikiType,
        sensorWikiUnit: sensor.sensorWikiUnit,
        sensorWikiPhenomenon: sensor.sensorWikiPhenomenon,
        // lastMeasurement: {
        //   value: (Math.random() * 100).toFixed(2),
        //   createdAt: new Date().toISOString(),
        // } as Prisma.JsonObject,
      },
    });
    printProgress(`ℹ️  Imported ${j} of ${sensors.length} sensors.`);
  }

  // This contains some measurements that can be used to test live Data: (Date: 2023-06-21T14:13:11.024Z)
  const jsonData = require("./boxes_full.json");
  async function updateSensor(id: string, lastMeasurement: any) {
    const sensor = await prisma.sensor.findFirst({
      where: {
        id: id,
      },
    });
    if (sensor) {
      await prisma.sensor.update({
        where: {
          id: id,
        },
        data: {
          lastMeasurement: lastMeasurement as Prisma.JsonObject,
        },
      });
    }
  }
  let k = 0;
  for await (const item of jsonData) {
    k++;
    for await (const sensor of item.sensors) {
      if (sensor.lastMeasurement && sensor._id) {
        await updateSensor(sensor._id, sensor.lastMeasurement);
        printProgress(
          `ℹ️  Imported ${k} of ${jsonData.length} devices with lastMeasurements.`,
        );
      }
    }
  }
  process.stdout.write("\n");

  try {
    const measurements = await csvtojson().fromFile("prisma/measurements.csv");
    let k = 0;
    for await (const measurement of measurements) {
      k++;
      await prisma.measurement.create({
        data: {
          time: new Date(measurement.time),
          value: Number(measurement.value),
          sensorId: measurement.sensorId,
        },
      });
      printProgress(
        `ℹ️  Imported ${k} of ${measurements.length} measurements.`,
      );
    }
    process.stdout.write("\n");
  } catch (error) {
    console.log("ℹ️  No measurements found for import!");
  }

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
