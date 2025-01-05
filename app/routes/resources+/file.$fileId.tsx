import { type DataFunctionArgs } from "react-router";
import invariant from "tiny-invariant";
import { drizzleClient } from "~/db.server";

export async function loader({ params }: DataFunctionArgs) {
  invariant(params.fileId, 'File ID is required');

  const image = await drizzleClient.query.profileImage.findFirst({
    where: (profileImage, { eq }) => eq(profileImage.id, params.fileId as string)
  })

  if (!image) throw new Response("Not found", { status: 404 });

  return new Response(image.blob, {
    headers: {
      "Content-Type": image.contentType,
      "Content-Length": Buffer.byteLength(image.blob).toString(),
      "Content-Disposition": `inline; filename="${params.fileId}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
