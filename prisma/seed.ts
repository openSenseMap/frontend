import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import csvtojson from "csvtojson";

const prisma = new PrismaClient();

function printProgress(text: string) {
  if (process.stdout.cursorTo) {
    process.stdout.cursorTo(0);
  }
  process.stdout.write(text);
}

async function seed() {
  const email = "opensensemap@opensenselab.org";

  // cleanup the existing database
  await prisma.sensor.deleteMany({}).catch(() => {});
  await prisma.device.deleteMany({}).catch(() => {});
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  const hashedPassword = await bcrypt.hash("osemrocks", 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });

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
