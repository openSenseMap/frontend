import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import {
  type DataFunctionArgs,
  json,
  redirect,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
} from "@remix-run/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { z } from "zod";
import { prisma } from "~/db.server";
import { requireUserId } from "~/session.server";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { LabelButton } from "~/components/label-button";
import { getUserImgSrc } from "~/utils/misc";

const MAX_SIZE = 1024 * 1024 * 3; // 3MB

/*
The preprocess call is needed because a current bug in @remix-run/web-fetch
for more info see the bug (https://github.com/remix-run/web-std-io/pull/28)
and the explanation here: https://conform.guide/file-upload
*/
const PhotoFormSchema = z.object({
  photoFile: z.preprocess(
    (value) => (value === "" ? new File([], "") : value),
    z
      .instanceof(File)
      .refine(
        (file) => file.name !== "" && file.size !== 0,
        "Image is required"
      )
      .refine((file) => {
        return file.size <= MAX_SIZE;
      }, "Image size must be less than 3MB")
  ),
});

export async function loader({ request }: DataFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.profile.findUnique({
    where: { userId: userId },
    select: { imageId: true, username: true },
  });
  if (!user) {
    console.log("User not found");
    throw new Error();
    // throw await authenticator.logout(request, { redirectTo: "/" });
  }
  return json({ user });
}

export async function action({ request }: DataFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await unstable_parseMultipartFormData(
    request,
    unstable_createMemoryUploadHandler({ maxPartSize: MAX_SIZE })
  );

  const submission = parse(formData, { schema: PhotoFormSchema });

  if (submission.intent !== "submit") {
    return json({ status: "idle", submission } as const);
  }
  if (!submission.value) {
    return json(
      {
        status: "error",
        submission,
      } as const,
      { status: 400 }
    );
  }

  const { photoFile } = submission.value;

  const newPrismaPhoto = {
    contentType: photoFile.type,
    file: {
      create: {
        blob: Buffer.from(await photoFile.arrayBuffer()),
      },
    },
  };

  const previousUserPhoto = await prisma.profile.findUnique({
    where: { userId: userId },
    select: { imageId: true },
  });

  await prisma.profile.update({
    select: { id: true },
    where: { userId: userId },
    data: {
      image: {
        upsert: {
          update: newPrismaPhoto,
          create: newPrismaPhoto,
        },
      },
    },
  });

  if (previousUserPhoto?.imageId) {
    void prisma.image
      .delete({
        where: { fileId: previousUserPhoto.imageId },
      })
      .catch(() => {}); // ignore the error, maybe it never existed?
  }

  return redirect("/settings/profile");
}

export default function PhotoChooserModal() {
  const data = useLoaderData<typeof loader>();
  const [newImageSrc, setNewImageSrc] = useState<string | null>(null);
  const navigate = useNavigate();
  const actionData = useActionData<typeof action>();
  const [form, { photoFile }] = useForm({
    id: "profile-photo",
    constraint: getFieldsetConstraint(PhotoFormSchema),
    lastSubmission: actionData?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: PhotoFormSchema });
    },
    shouldRevalidate: "onBlur",
  });

  const dismissModal = () => navigate("..", { preventScrollReset: true });
  return (
    <Dialog open={true}>
      <DialogContent
        onEscapeKeyDown={dismissModal}
        onPointerDownOutside={dismissModal}
      >
        <DialogHeader>
          <DialogTitle>Profile photo</DialogTitle>
        </DialogHeader>
        <Form
          method="post"
          encType="multipart/form-data"
          className="mt-8 flex flex-col items-center justify-center gap-10"
          onReset={() => setNewImageSrc(null)}
          {...form.props}
        >
          <img
            src={newImageSrc ?? getUserImgSrc(data.user.imageId)}
            className="h-64 w-64 rounded-full"
            alt={"test"}
          />
          {/* <ErrorList errors={photoFile.errors} id={photoFile.id} /> */}
          <input
            {...conform.input(photoFile, { type: "file" })}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={newImageSrc ? -1 : 0}
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  setNewImageSrc(event.target?.result?.toString() ?? null);
                };
                reader.readAsDataURL(file);
              }
            }}
          />
          {newImageSrc ? (
            <div className="flex gap-4">
              <Button type="submit">Save Photo</Button>
              <Button type="reset">Reset</Button>
            </div>
          ) : (
            <div className="flex gap-4">
              <LabelButton htmlFor={photoFile.id}>✏️ Change</LabelButton>
            </div>
          )}
          {/* <ErrorList errors={form.errors} /> */}
        </Form>
      </DialogContent>
    </Dialog>
  );
}