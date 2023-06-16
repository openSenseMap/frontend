import { Exposure, Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
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

const preparePasswordHash = function preparePasswordHash(
  plaintextPassword: string
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
    13
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

  //* create intial user
  const user = await prisma.user.create({
    data: dummyUser,
  });

  //* initial devices data
  const dummySensors = [
    {
      title: "Beleuchtungsstärke",
      sensorType: "TSL45315",
      unit: "lx",
    },
    {
      title: "UV-Intensität",
      sensorType: "VEML6070",
      unit: "μW/cm²",
    },
  ];

  //* create one device at time, cuz (using createMany, you cannot nest relation queries -> sensors)
  /* const dummyDevice = {
    id: "cliuf5m9f9",
    userId: "cliknu1mw0000k8055r9gd4pk", //* needs to be updated manually
    // userId: user.id,
    name: "test LTR22222",
    exposure: Exposure.MOBILE,
    useAuth: true,
    latitude: 49.225521,
    longitude: 6.999605,
    model: "homeV2Wifi",
    createdAt: new Date("2022-04-25T11:06:24.526Z"),
    updatedAt: new Date("2022-06-28T15:06:06.437Z"),
    sensors: {
      create: dummySensors,
    },
  };
  //* create intial device
  const device = await prisma.device.create({
    data: dummyDevice,
  }); */

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
        useAuth: false,
        latitude: Number(device.latitude),
        longitude: Number(device.longitude),
      },
    });
    printProgress(`ℹ️  Imported ${i} of ${devices.length} devices.`);
  }
  process.stdout.write("\n");

  const sensors = await csvtojson().fromFile("prisma/sensors.csv");

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
        lastMeasurement: {
          value: (Math.random() * 100).toFixed(2),
          createdAt: new Date().toISOString(),
        } as Prisma.JsonObject,
      },
    });
    printProgress(`ℹ️  Imported ${j} of ${sensors.length} sensors.`);
  }
  process.stdout.write("\n");

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
