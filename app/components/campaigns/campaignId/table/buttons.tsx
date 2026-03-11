import { EditIcon, SaveIcon, XIcon } from "lucide-react";
import { Button } from "~/components/ui/button";

type Props = {
  setEditMode?: any;
  t: any;
};

export function EditButton({ setEditMode, t }: Props) {
  return (
    <Button
      className="bg-blue-700 text-white"
      variant="outline"
      onClick={() => setEditMode(true)}
    >
      {t("edit")}
      <EditIcon className="ml-2 h-4 w-4" />
    </Button>
  );
}

export function CancelButton({ setEditMode, t }: Props) {
  return (
    <Button variant="outline" onClick={() => setEditMode(false)}>
      {t("cancel")} <XIcon className="ml-2 h-4 w-4 " />
    </Button>
  );
}

export function SaveButton({ t }: Props) {
  return (
    <Button
      className="bg-blue-700 text-white"
      variant="outline"
      type="submit"
      name="_action"
      value="UPDATE_CAMPAIGN"
    >
      {t("save")} <SaveIcon className="ml-2 h-4 w-4 " />
    </Button>
  );
}
