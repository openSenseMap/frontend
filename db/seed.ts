import "dotenv/config";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import csvtojson from "csvtojson";
import { sensor } from "./schema/sensor";
import { device } from "./schema/device";
import type { InsertUser } from "./schema/user";
import { user } from "./schema/user";
import { measurement } from "./schema/measurement";
import { password } from "./schema/password";
import { profile } from "./schema/profile";

const connectionString = process.env.DATABASE_URL!;

console.log(`🔌 setting up drizzle client to ${connectionString}`);

const queryClient = postgres(connectionString);
const client = drizzle(queryClient);

function printProgress(text: string) {
  if (process.stdout.cursorTo) {
    process.stdout.cursorTo(0);
  }
  process.stdout.write(text);
}

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
  const dummyUser: InsertUser = {
    id: "cleqyv5pi00003uxdszv4mdnk", //* to connect it to imported data
    name: "sensei",
    email: email,
    role: "user",
    language: "en_US",
    emailIsConfirmed: true,
  };

  //* cleanup the existing database (if any)
  await client.delete(sensor).catch(() => {});
  await client.delete(device).catch(() => {});
  await client.delete(user).catch((err) => console.log("DELETE users", err));
  await client.delete(measurement).catch(() => {});

  //* create intial user
  await client.insert(user).values(dummyUser);
  await client.insert(password).values({
    hash: hashedPassword,
    userId: dummyUser.id,
  });

  // Create profile for initial user
  await client.insert(profile).values({
    username: "sensei",
    public: false,
    userId: dummyUser.id,
  });
  console.log(`ℹ️  Create profile sensei 🥷🏼  for account with ${email}`);

  // Import devices and connect it to user
  const devices = await csvtojson().fromFile("./db/seeds/devices.csv");
  let i = 0;
  for await (const csvDevice of devices) {
    i++;
    await client.insert(device).values({
      id: csvDevice.id,
      userId: dummyUser.id as string,
      name: csvDevice.name,
      exposure: csvDevice.exposure,
      status: "inactive",
      useAuth: csvDevice.useAuth,
      latitude: Number(csvDevice.latitude),
      longitude: Number(csvDevice.longitude),
    });
    printProgress(`ℹ️  Imported ${i} of ${devices.length} devices.`);
  }
  process.stdout.write("\n");

  const sensors = await csvtojson().fromFile("./db/seeds/sensors.csv");

  let j = 0;
  for await (const csvSensor of sensors) {
    j++;
    await client.insert(sensor).values({
      id: csvSensor.id,
      deviceId: csvSensor.deviceId,
      title: csvSensor.title,
      sensorType: csvSensor.sensorType,
      unit: csvSensor.unit,
    });
    printProgress(`ℹ️  Imported ${j} of ${sensors.length} sensors.`);
  }
  process.stdout.write("\n");

  try {
    const measurements = await csvtojson().fromFile(
      "./db/seeds/measurements.csv",
    );
    let k = 0;
    for await (const csvMeasurement of measurements) {
      k++;
      await client.insert(measurement).values({
        time: new Date(csvMeasurement.time),
        value: Number(csvMeasurement.value),
        sensorId: csvMeasurement.senorId,
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
    await queryClient.end({ timeout: 5 });
  });
