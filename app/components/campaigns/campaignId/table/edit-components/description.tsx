import { ClientOnly } from "remix-utils";
import { MarkdownEditor } from "~/markdown.client";

type Props = {
  editDescription: any;
  descriptionRef: any;
  setEditDescription: any;
  t: any;
};
export function EditDescription({
  editDescription,
  setEditDescription,
  descriptionRef,
  t,
}: Props) {
  return (
    <>
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
    </>
  );
}
