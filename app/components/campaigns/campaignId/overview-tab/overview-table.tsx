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
import { EditIcon, TrashIcon } from "lucide-react";
import Markdown from "markdown-to-jsx";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

type OverviewTableProps = {
  campaign: Campaign;
  userId: string;
};

export default function OverviewTable({
  campaign,
  userId,
}: OverviewTableProps) {
  const [editMode, setEditMode] = useState(false);
  console.log(userId, campaign.ownerId);
  return (
    <div>
      {userId === campaign.ownerId && (
        <div className="float-right flex gap-2">
          <Button variant="outline" onClick={() => setEditMode(true)}>
            Edit
            <EditIcon className="ml-2 h-4 w-4" />
          </Button>
          <Dialog>
            <DialogTrigger>
              <Button variant="outline">
                Delete
                <TrashIcon className="ml-2 h-4 w-4 text-red-500" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Sind Sie sicher dass Sie diese Kampagne löschen möchten?
                </DialogTitle>
              </DialogHeader>
              <Form method="post">
                <input
                  className="hidden"
                  id="campaignId"
                  name="campaignId"
                  type="text"
                  value={campaign.id}
                />
                <Button
                  variant="outline"
                  name="_action"
                  value="DELETE_CAMPAIGN"
                  type="submit"
                  className="float-right bg-red-500 text-white"
                >
                  Löschen <TrashIcon className="ml-2 h-4 w-4 text-white" />
                </Button>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      )}
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
            <TableCell>{campaign.hardware_available ? "Ja" : "Nein"}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
