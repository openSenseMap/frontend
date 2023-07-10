import { Form } from "@remix-run/react";
import { ClientOnly } from "remix-utils";
import { MarkdownEditor } from "~/markdown.client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type EventFormProps = {
  eventDescription: string;
  setEventDescription: any;
  eventTextAreaRef: any;
};

export default function EventForm({
  eventDescription,
  setEventDescription,
  eventTextAreaRef,
}: EventFormProps) {
  return (
    <div className="flex">
      <p className="mx-1">Noch keine Events für diese Kampagne.</p>
      <Dialog>
        <DialogTrigger>
          <p>Erstelle hier ein Event</p>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erstelle ein Event</DialogTitle>
            <DialogDescription>
              Erstelle ein Event für diese Kampagne
            </DialogDescription>
          </DialogHeader>
          <div className="mx-auto w-full max-w-md px-8">
            <Form className="space-y-6" method="post">
              <div>
                <label htmlFor="title">
                  <span className="text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']">
                    Titel
                  </span>
                </label>
                <div className="mt-1 w-full">
                  <input
                    className="w-full"
                    id="title"
                    name="title"
                    type="text"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="description">
                  <span className="text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']">
                    Beschreibung
                  </span>
                </label>
                <div className="mt-1">
                  <textarea
                    className="hidden"
                    value={eventDescription}
                    id="description"
                    name="description"
                  ></textarea>
                  <ClientOnly>
                    {() => (
                      <>
                        <MarkdownEditor
                          textAreaRef={eventTextAreaRef}
                          comment={eventDescription}
                          setComment={setEventDescription}
                        />
                        <div className="w-100 border-blue-grey relative flex justify-between rounded-b-lg border border-l border-r border-t-0 px-2 py-1 shadow-md">
                          <span className="text-gray text-xs leading-4">
                            Bild hinzufügen
                          </span>
                          <span className="text-gray text-xs leading-4">
                            Markdown unterstützt
                          </span>
                        </div>
                      </>
                    )}
                  </ClientOnly>
                </div>
              </div>
              <div>
                <label htmlFor="startDate">
                  <span className="text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']">
                    Beginn
                  </span>
                </label>
                <div className="mt-1">
                  <input
                    className="w-full"
                    id="startDate"
                    name="startDate"
                    type="datetime-local"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="startDate">
                  <span className="text-sm font-medium text-gray-700 after:text-red-500 after:content-['_*']">
                    Abschluss
                  </span>
                </label>
                <div className="mt-1">
                  <input
                    className="w-full"
                    id="endDate"
                    name="endDate"
                    type="datetime-local"
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  type="submit"
                  name="_action"
                  value="CREATE_EVENT"
                  className="hover:bg-blue-600 focus:bg-blue-400  rounded bg-blue-500 py-2 px-4 text-white"
                >
                  CREATE
                </button>
              </div>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
