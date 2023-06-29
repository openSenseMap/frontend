import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { InfoIcon } from "lucide-react";

type InfoCardProps = {
  content: any;
};

export function InfoCard({ content }: InfoCardProps) {
  return (
    <HoverCard>
      <HoverCardTrigger>
        <InfoIcon className="h-4 w-4 text-blue-700" />
      </HoverCardTrigger>
      <HoverCardContent>{content}</HoverCardContent>
    </HoverCard>
  );
}
