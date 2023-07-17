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
import { Switch } from "@/components/ui/switch";
import {
  ChevronDown,
  EditIcon,
  SaveIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import Markdown from "markdown-to-jsx";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Priority, Exposure } from "@prisma/client";
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
import { MarkdownEditor } from "~/markdown.client";
import { ClientOnly } from "remix-utils";
import { useTranslation } from "react-i18next";

type EditTableProps = {
  setEditMode: any;
  campaign: any;
  phenomena: string[];
};

export default function EditTable({
  setEditMode,
  campaign,
  phenomena,
}: EditTableProps) {
  const descriptionRef = useRef();
  const [editDescription, setEditDescription] = useState<string | undefined>(
    ""
  );
  const [priority, setPriority] = useState("MEDIUM");
  const [openDropdown, setDropdownOpen] = useState(false);
  const [phenomenaState, setPhenomenaState] = useState(
    Object.fromEntries(phenomena.map((p: string) => [p, false]))
  );
  const [exposure, setExposure] = useState("UNKNOWN");
  const { t } = useTranslation("edit-campaign-table");

  return (
    <Form method="post">
      <input
        className="hidden"
        id="campaignId"
        name="campaignId"
        value={campaign.id}
      />
      <div className="float-right flex gap-2">
        <Button variant="outline" onClick={() => setEditMode(false)}>
          {t("cancel")} <XIcon className="ml-2 h-4 w-4 " />
        </Button>
        <Button
          variant="outline"
          type="submit"
          name="_action"
          value="UPDATE_CAMPAIGN"
        >
          {t("save")} <SaveIcon className="ml-2 h-4 w-4 text-blue-700" />
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("attribute")}</TableHead>
            <TableHead>{t("value")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>{t("title")}</TableCell>
            <TableCell>
              <input id="title" name="title" />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("description")}</TableCell>
            <TableCell>
              <textarea
                className="hidden"
                id="description"
                name="description"
                value={editDescription}
              ></textarea>
              <ClientOnly>
                {() => (
                  <>
                    <MarkdownEditor
                      textAreaRef={descriptionRef}
                      comment={editDescription}
                      setComment={setEditDescription}
                    />
                    <div className="w-100 border-blue-grey relative flex justify-between rounded-b-lg border border-l border-r border-t-0 px-2 py-1 shadow-md">
                      <span className="text-gray text-xs leading-4">
                        {t("add image")}
                      </span>
                      <span className="text-gray text-xs leading-4">
                        {t("markdown supported")}
                      </span>
                    </div>
                  </>
                )}
              </ClientOnly>
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
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Priorities</SelectLabel>
                    {Object.keys(Priority).map((key: string) => {
                      return (
                        <SelectItem key={key} value={key}>
                          {key}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("start date")}</TableCell>
            <TableCell>
              <input type="date" name="startDate" id="startDate" />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("end date")}</TableCell>
            <TableCell>
              <input type="date" name="endDate" id="endDate" />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("phenomena")}</TableCell>
            <TableCell>
              <input
                type="hidden"
                // ref={phenomenaRef}
                name="phenomena"
                value={JSON.stringify(phenomenaState)}
              />
              <DropdownMenu
                open={openDropdown}
                onOpenChange={setDropdownOpen}
                modal={false}
              >
                <DropdownMenuTrigger asChild>
                  <Button className="w-full truncate" variant="outline">
                    {Object.keys(phenomenaState)
                      .filter((key) => phenomenaState[key])
                      .join(", ")}
                    {Object.keys(phenomenaState).filter(
                      (key) => phenomenaState[key]
                    ).length > 0 ? (
                      <></>
                    ) : (
                      <span>{t("phenomena")}</span>
                    )}
                    <span className="text-red-500">&nbsp;*</span>
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {phenomena.map((p: any) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={p}
                        checked={phenomenaState[p]}
                        onCheckedChange={() => {
                          setPhenomenaState({
                            ...phenomenaState,
                            [p]: !phenomenaState[p],
                          });
                        }}
                        onSelect={(event) => event.preventDefault()}
                      >
                        {p}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
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
              <Select value={exposure} onValueChange={setExposure}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an exposure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Exposures</SelectLabel>
                    {Object.keys(Exposure).map((key: string) => {
                      return (
                        <SelectItem key={key} value={key}>
                          {key}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("hardware available")}</TableCell>
            <TableCell>
              <div className="flex w-fit justify-between gap-2">
                <span>{t("no")}</span>
                <Switch
                  id="hardware_available"
                  // ref={hardwareAvailableRef}
                  name="hardware_available"
                />
                <span>{t("yes")}</span>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Form>
  );
}
