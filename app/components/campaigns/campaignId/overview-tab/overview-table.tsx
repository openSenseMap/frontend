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
import { Form } from "@remix-run/react";
import { EditIcon, SaveIcon, TrashIcon, XIcon } from "lucide-react";
import Markdown from "markdown-to-jsx";
import { Button } from "~/components/ui/button";
import { useState, useRef } from "react";
import EditTable from "./edit-table";
import { CountryFlagIcon } from "~/components/ui/country-flag";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { HoverCard } from "~/components/ui/hover-card";
import { HoverCardContent, HoverCardTrigger } from "@radix-ui/react-hover-card";

type OverviewTableProps = {
  campaign: Campaign;
  userId: string;
  phenomena: string[];
};

export default function OverviewTable({
  campaign,
  userId,
  phenomena,
}: OverviewTableProps) {
  const [editMode, setEditMode] = useState(false);
  const [editDescription, setEditDescription] = useState<string | undefined>(
    ""
  );
  const descriptionRef = useRef();
  return (
    <div>
      {userId === campaign.ownerId && !editMode && (
        <Button
          className="float-right bg-blue-700 text-white"
          variant="outline"
          onClick={() => setEditMode(true)}
        >
          <span>Edit</span>
          <EditIcon className="ml-2 h-4 w-4" />
        </Button>
      )}
      {!editMode ? (
        <>
          <div>
            <h2 className="font-bold">Contributors</h2>
            <div className="flex">
              <HoverCard>
                <HoverCardTrigger>
                  <Avatar className="hover:cursor-pointer">
                    <AvatarImage src="" alt="avatar" />
                    <AvatarFallback>JR</AvatarFallback>
                  </Avatar>
                </HoverCardTrigger>
                <HoverCardContent>
                  <div className="w-fit bg-white">
                    <p>Jona159</p>
                  </div>
                </HoverCardContent>
              </HoverCard>
              <Avatar>
                <AvatarImage src="" alt="avatar" />
                <AvatarFallback>JO</AvatarFallback>
              </Avatar>
            </div>
          </div>
          <Table className="mt-4">
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
                  {campaign.participants.length} /{" "}
                  {campaign.minimumParticipants}
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
                <TableCell>Location</TableCell>
                <TableCell className="flex">
                  <CountryFlagIcon
                    country={String(campaign.country).toUpperCase()}
                  />{" "}
                  {campaign.country?.toUpperCase()}
                </TableCell>
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
                <TableCell>
                  {campaign.hardware_available ? "Ja" : "Nein"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </>
      ) : (
        <EditTable
          campaign={campaign}
          setEditMode={setEditMode}
          phenomena={phenomena}
        />
      )}
    </div>
  );
}
