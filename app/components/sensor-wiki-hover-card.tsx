import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useEffect, useState } from "react";
import getUserLocale from "get-user-locale";

interface SensorWikHoverCardProps {
  slug: string;
  type: "phenomena" | "sensors" | "devices" | "domains" | "units";
  trigger: React.ReactNode;
}
const getData = async (slug: string, type: string) => {
  const locale = getUserLocale();
  console.log(locale);
  const response = await fetch(
    `${ENV.SENSORWIKI_API_URL}${type}/${slug}?lang=${locale}`,
  );
  const data = await response.json();
  console.log(data);

  let content;
  switch (type) {
    case "phenomena":
      content = (
        <div>
          {data.description
            ? data.description.item[0].text
            : "No data available."}
        </div>
      );
      break;
    case "sensors":
      content = (
        <div>
          {data.description
            ? data.description.item[0].text
            : "No data available."}
        </div>
      );
      break;
    case "devices":
      content = (
        <div>
          {data.description
            ? data.description.item[0].text
            : "No data available."}
        </div>
      );
      break;
    case "domains":
      content = (
        <div>
          {data.description
            ? data.description.item[0].text
            : "No data available."}
        </div>
      );
      break;
    case "units":
      content = (
        <div>
          {data.description
            ? data.description.item[0].text
            : "No data available."}
        </div>
      );
      break;
    default:
      content = <div>No information found.</div>;
  }

  return content;
};

export default function SensorWikHoverCard(props: SensorWikHoverCardProps) {
  const [content, setContent] = useState<any | null>(null);
  const { slug, type, trigger } = props;

  useEffect(() => {
    getData(slug, type).then((content) => {
      setContent(content);
    });
  });

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
      <HoverCardContent>{content}</HoverCardContent>
    </HoverCard>
  );
}