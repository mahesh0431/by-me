import { getCollection } from "astro:content";

export async function getProfile() {
  const [profile] = await getCollection("profile");

  if (!profile) {
    throw new Error('Missing profile content entry in collection "profile".');
  }

  return profile;
}
