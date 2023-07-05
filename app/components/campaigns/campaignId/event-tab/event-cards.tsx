import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "~/components/ui/button";
import { EditIcon, TrashIcon } from "lucide-react";
import { Form } from "@remix-run/react";
import { ClientOnly } from "remix-utils";
import { MarkdownEditor } from "~/markdown.client";
import Markdown from "markdown-to-jsx";

type EventCardsProps = {
  events: any[];
  eventEditMode: boolean;
  setEventEditMode: any;
  setEditEventTitle: any;
  userId: string;
  eventTextAreaRef: any;
  editEventDescription: string;
  setEditEventDescription: any;
  editEventTitle: string;
  setEditEventStartDate: any;
};

export default function EventCards({
  events,
  eventEditMode,
  editEventTitle,
  setEditEventStartDate,
  editEventDescription,
  setEditEventDescription,
  eventTextAreaRef,
  setEventEditMode,
  setEditEventTitle,
  userId,
}: EventCardsProps) {
  return (
    <div>
      {events.map((e: any, i: number) => (
        <div key={i} className="flex flex-col items-center justify-center">
          <Card className="w-fit min-w-[300px]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  {eventEditMode ? (
                    <input
                      className="mr-4"
                      type="text"
                      onChange={(e) => setEditEventTitle(e.target.value)}
                      placeholder="Enter new title"
                    />
                  ) : (
                    <p className="mr-4">{e.title}</p>
                  )}
                </div>
                {userId === e.ownerId && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEventEditMode(true)}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Form method="post">
                      <input
                        className="hidden"
                        id="eventId"
                        name="eventId"
                        type="text"
                        value={e.id}
                      />
                      <Button
                        variant="outline"
                        name="_action"
                        value="DELETE_EVENT"
                        type="submit"
                      >
                        <TrashIcon className="h-4 w-4 text-red-500" />
                      </Button>
                    </Form>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col">
              <span className="font-bold">Beschreibung: </span>
              {eventEditMode ? (
                <ClientOnly>
                  {() => (
                    <>
                      <MarkdownEditor
                        textAreaRef={eventTextAreaRef}
                        comment={editEventDescription}
                        setComment={setEditEventDescription}
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
              ) : (
                <Markdown>{e.description}</Markdown>
              )}
              <span className="font-bold">Beginn: </span>
              {eventEditMode ? (
                <input
                  type="datetime-locale"
                  onChange={() => setEditEventStartDate}
                />
              ) : (
                <p>{e.startDate}</p>
              )}
              <span className="font-bold">Abschluss: </span>
              <p>{e.endDate}</p>
            </CardContent>
            {userId === e.ownerId && eventEditMode && (
              <CardFooter>
                <Form method="post" className="space-y-2">
                  <input
                    className="hidden"
                    id="eventId"
                    name="eventId"
                    type="text"
                    value={e.id}
                  />
                  <input
                    className="hidden"
                    id="title"
                    name="title"
                    type="text"
                    value={editEventTitle}
                  />
                  <textarea
                    className="hidden"
                    id="description"
                    name="description"
                    value={editEventDescription}
                  ></textarea>
                  <input
                    className="hidden"
                    id="startDate"
                    name="startDate"
                    type="date"
                    // value={editEventStartDate}
                  />
                  <input
                    // value={editEventEndDate}
                    className="hidden"
                    id="endDate"
                    name="endDate"
                    type="date"
                  />

                  <Button
                    className="float-right"
                    name="_action"
                    value="UPDATE_EVENT"
                    type="submit"
                    // onClick={() => setEventEditMode(false)}
                  >
                    ÜBERNEMEN
                  </Button>
                </Form>
              </CardFooter>
            )}
          </Card>
        </div>
      ))}
    </div>
  );
}
