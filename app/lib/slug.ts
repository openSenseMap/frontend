import slugify from "slugify";
import { prisma } from "~/db.server";

/**
 * Generates a slug for a campaign title. Throws error if no slug was found
 * @param title title to slugify
 * @returns Promise with new slug
 */
export async function generateSlug(title: string) {
  return new Promise<string>(async (resolve, reject) => {
    const slug = slugify(title, {
      lower: true,
      strict: true,
    });
    const unique = await uniqueSlug(slug);
    if (!unique) {
      return reject("Slug is not unique");
    }
    resolve(unique);
  });
}

/**
 * Get a unique slug for a campaign
 * @param slug the slug to check
 * @param maxSuffix optional max suffix to check
 * @returns unique campaign slug, undefined if no unique slug was found
 * @example
 * Simple example
 * ```ts
 * const slug = "my-campaign"
 * const unique = await uniqueSlug(slug)
 * ```
 */
const uniqueSlug = async (slug: string, maxSuffix = 1000) => {
  for (let suffix = 0; suffix < maxSuffix; suffix++) {
    const slugToCheck = suffix === 0 ? slug : `${slug}-${suffix}`;
    // Check if the current slug with the current suffix exists
    const existingSlug = await prisma.campaign.findUnique({
      where: { slug: slugToCheck },
    });
    if (!existingSlug) {
      return slugToCheck;
    }
  }
};
