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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useRef } from "react";
import EditTable from "./edit-table";

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
          className="float-right"
          variant="outline"
          onClick={() => setEditMode(true)}
        >
          <span>Edit</span>
          <EditIcon className="ml-2 h-4 w-4" />
        </Button>
      )}
      {!editMode ? (
        <Table>
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
              <TableCell>
                {campaign.hardware_available ? "Ja" : "Nein"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
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