import type { Prisma } from "@prisma/client";

// https://github.com/prisma/prisma/discussions/10928#discussioncomment-1920961
type DeviceWithSensors = Prisma.DeviceGetPayload<{
  include: {
    sensors: true;
  };
}>;

export { DeviceWithSensors };
