import { Badge } from "../ui/badge"

export type DeviceExposureEnum = "indoor" | "outdoor" | "mobile" | "unknown"

export function ExposureBadge({ exposure }: { exposure: DeviceExposureEnum }) {
  const colorMap: Record<string, string> = {
    indoor: "bg-blue-500",
    outdoor: "bg-green-500",
    mobile: "bg-purple-500",
    unknown: "bg-gray-500",
  }

  return <Badge className={`${colorMap[exposure]} text-white`}>{exposure}</Badge>
}
