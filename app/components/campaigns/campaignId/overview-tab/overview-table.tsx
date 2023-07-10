import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Campaign } from "@prisma/client";
import Markdown from "markdown-to-jsx";

type OverviewTableProps = {
  campaign: Campaign;
};

export default function OverviewTable({ campaign }: OverviewTableProps) {
  return (
    <Table>
      <TableCaption>Campaign Overview</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Attribut</TableHead>
          <TableHead>Wert</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Beschreibung</TableCell>
          <TableCell>
            <Markdown>{campaign.description}</Markdown>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Priorität</TableCell>
          <TableCell>{campaign.priority}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Teilnehmer</TableCell>
          <TableCell>
            {campaign.participants.length} / {campaign.requiredParticipants}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Erstellt am</TableCell>
          <TableCell>{JSON.stringify(campaign.createdAt)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Bearbeitet am</TableCell>
          <TableCell>{JSON.stringify(campaign.updatedAt)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Phänomene</TableCell>
          <TableCell>{campaign.phenomena}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Exposure</TableCell>
          <TableCell>{campaign.exposure}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Hardware verfügbar</TableCell>
          <TableCell>{campaign.hardware_available ? "Ja" : "Nein"}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
