import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Campaign } from "~/schema";
// import type { Campaign } from "@prisma/client";
import { Form } from "@remix-run/react";
import { Switch } from "@/components/ui/switch";
import Markdown from "markdown-to-jsx";
import { priorityEnum, exposureEnum } from "~/schema";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { CountryDropdown } from "../../overview/country-dropdown";
import PhenomenaDropdown from "./edit-components/phenomena";
import { EditButton, CancelButton, SaveButton } from "./buttons";
import { EditDescription } from "./edit-components/description";

type EditTableProps = {
  owner: boolean;
  campaign: any;
  phenomena: string[];
};

export default function CampaignTable({
  owner,
  campaign,
  phenomena,
}: EditTableProps) {
  const descriptionRef = useRef();
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState<string>(campaign.title);
  const [editDescription, setEditDescription] = useState<string | undefined>(
    campaign.description
  );
  const [priority, setPriority] = useState(campaign.priority);
  const [startDate, setStartDate] = useState(campaign.startDate);
  const [endDate, setEndDate] = useState(campaign.endDate);
  const [minimumParticipants, setMinimumParticipants] = useState(
    campaign.minimumParticipants
  );
  const [openDropdown, setDropdownOpen] = useState(false);
  const [phenomenaState, setPhenomenaState] = useState(
    Object.fromEntries(phenomena.map((p: string) => [p, false]))
  );
  const [exposure, setExposure] = useState(campaign.exposure);
  const [country, setCountry] = useState(campaign.country);
  const { t } = useTranslation("edit-campaign-table");

  return (
    <Form method="post" className="w-full">
      <input
        className="hidden"
        id="campaignId"
        name="campaignId"
        value={campaign.id}
      />
      <Table className="mt-4">
        <TableHeader>
          <TableRow>
            <TableHead>{t("attribute")}</TableHead>
            <TableHead>{t("value")}</TableHead>
            {owner && !editMode ? (
              <EditButton setEditMode={setEditMode} t={t} />
            ) : owner && editMode ? (
              <>
                <CancelButton setEditMode={setEditMode} t={t} />
                <SaveButton t={t} />
              </>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>{t("title")}</TableCell>
            <TableCell>
              {editMode ? (
                <input
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              ) : (
                <span>{campaign.title}</span>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("description")}</TableCell>
            <TableCell>
              {editMode ? (
                <EditDescription
                  descriptionRef={descriptionRef}
                  editDescription={editDescription}
                  setEditDescription={setEditDescription}
                  t={t}
                />
              ) : (
                <Markdown>{campaign.description}</Markdown>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("priority")}</TableCell>
            <TableCell>
              <input
                id="priority"
                name="priority"
                type="hidden"
                value={priority}
              />
              {editMode ? (
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Priorities</SelectLabel>
                      {priorityEnum.enumValues.map((key: string) => {
                        return (
                          <SelectItem key={key} value={key}>
                            {key}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <span>{campaign.priority}</span>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("start date")}</TableCell>
            <TableCell>
              {editMode ? (
                <input
                  type="date"
                  name="startDate"
                  id="startDate"
                  value={startDate}
                  onChange={setStartDate}
                />
              ) : (
                <>{campaign.startDate}</>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("end date")}</TableCell>
            <TableCell>
              {editMode ? (
                <input
                  type="date"
                  name="endDate"
                  id="endDate"
                  value={endDate}
                  onChange={setEndDate}
                />
              ) : (
                <>{campaign.endDate}</>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("location")}</TableCell>
            <TableCell>
              <input
                className="hidden"
                id="country"
                name="country"
                value={country}
              />
              {editMode ? (
                <CountryDropdown setCountry={setCountry} />
              ) : (
                <>{campaign.countries}</>
              )}
            </TableCell>
          </TableRow>
          <input
            className="hidden"
            value={minimumParticipants}
            name="minimumParticipants"
            id="minimumParticipants"
          />
          <TableRow>
            <TableCell>{t("phenomena")}</TableCell>
            <TableCell>
              <input
                type="hidden"
                // ref={phenomenaRef}
                name="phenomena"
                value={JSON.stringify(phenomenaState)}
              />
              {editMode ? (
                <PhenomenaDropdown
                  openDropdown={openDropdown}
                  phenomena={phenomena}
                  phenomenaState={phenomenaState}
                  setDropdownOpen={setDropdownOpen}
                  setPhenomenaState={setPhenomenaState}
                />
              ) : (
                <>{campaign.phenomena}</>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("exposure")}</TableCell>
            <TableCell>
              <input
                id="exposure"
                name="exposure"
                // ref={exposureRef}
                type="hidden"
                value={exposure}
              />
              {editMode ? (
                <Select value={exposure} onValueChange={setExposure}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an exposure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Exposures</SelectLabel>
                      {exposureEnum.enumValues.map((key: string) => {
                        return (
                          <SelectItem key={key} value={key}>
                            {key}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <>{campaign.exposure}</>
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("hardware available")}</TableCell>
            <TableCell>
              {editMode ? (
                <div className="flex w-fit justify-between gap-2">
                  <span>{t("no")}</span>
                  <Switch
                    id="hardware_available"
                    // ref={hardwareAvailableRef}
                    name="hardware_available"
                  />
                  <span>{t("yes")}</span>
                </div>
              ) : (
                <>{campaign.hardwareAvailable}</>
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Form>
  );
}
