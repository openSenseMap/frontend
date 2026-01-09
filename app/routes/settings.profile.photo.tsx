import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { type FileUpload, parseFormData } from "@mjackson/form-data-parser";
import { eq } from "drizzle-orm";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  data,
  redirect,
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
} from "react-router";
import { z } from "zod";
import ErrorMessage from "~/components/error-message";
import { LabelButton } from "~/components/label-button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { drizzleClient } from "~/db.server";
import { getProfileByUserId } from "~/models/profile.server";
import { getUserById } from "~/models/user.server";
import { profileImage } from "~/schema";
import { uploadHandler } from "~/utils/file-upload.server";
import { getInitials } from "~/utils/misc";
import { requireUserId } from "~/utils/session.server";

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
        "Image is required",
      )
      .refine((file) => {
        return file.size <= MAX_SIZE;
      }, "Image size must be less than 3MB"),
  ),
});

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await getUserById(userId);
  const profile = await getProfileByUserId(userId);
  if (!user) {
    throw new Error();
    // throw await authenticator.logout(request, { redirectTo: "/" });
  }
  return { user, profile };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await parseFormData(
    request,
    { maxFileSize: MAX_SIZE },
    async (file: FileUpload) => uploadHandler(file),
  );

  const submission = parse(formData, { schema: PhotoFormSchema });

  if (submission.intent !== "submit") {
    return { status: "idle", submission } as const;
  }
  if (!submission.value) {
    return data(
      {
        status: "error",
        submission,
      } as const,
      { status: 400 },
    );
  }

  const { photoFile } = submission.value;

  // Query user profile
  const previousProfileWithImage = await drizzleClient.query.profile.findFirst({
    where: (profile, { eq }) => eq(profile.userId, userId),
    with: { profileImage: true },
  });

  // Store the old image ID before inserting new one
  const oldImageId = previousProfileWithImage?.profileImage?.id;

  // Insert new profile image and get the new ID back
  const [newImage] = await drizzleClient
    .insert(profileImage)
    .values({
      blob: Buffer.from(await photoFile.arrayBuffer()),
      contentType: photoFile.type,
      profileId: previousProfileWithImage?.id,
    })
    .returning();

  // Delete the OLD image (not the new one)
  if (oldImageId && oldImageId !== newImage.id) {
    await drizzleClient
      .delete(profileImage)
      .where(eq(profileImage.id, oldImageId));
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

  const { t } = useTranslation("settings");

  const dismissModal = () => navigate("..", { preventScrollReset: true });
  return (
    <Dialog open={true} onOpenChange={dismissModal}>
      <DialogContent
        onEscapeKeyDown={dismissModal}
        onPointerDownOutside={dismissModal}
        className="dark:bg-dark-background dark:text-dark-text dark:border-dark-border"
      >
        <DialogHeader>
          <DialogTitle>{t("profile_photo")}</DialogTitle>
        </DialogHeader>
        <Form
          method="post"
          encType="multipart/form-data"
          className="mt-8 flex flex-col items-center justify-center gap-10"
          onReset={() => setNewImageSrc(null)}
          {...form.props}
        >
          <Avatar className="h-64 w-64">
            <AvatarImage
              className="aspect-auto w-full h-full rounded-full object-cover"
              src={
                newImageSrc
                  ? newImageSrc
                  : "/resources/file/" + data.profile?.profileImage?.id
              }
            />
            <AvatarFallback>
              {getInitials(data.profile?.username ?? "")}
            </AvatarFallback>
          </Avatar>
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
              <Button type="submit">{t("save_photo")}</Button>
              <Button type="reset">{t("reset")}</Button>
            </div>
          ) : (
            <div className="flex gap-4">
              <LabelButton htmlFor={photoFile.id}>{t("change")}</LabelButton>
            </div>
          )}
          {/* <ErrorList errors={form.errors} /> */}
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ErrorBoundary() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ErrorMessage />
    </div>
  );
}
