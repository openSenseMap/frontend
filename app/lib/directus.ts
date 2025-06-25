import { createDirectus, rest } from "@directus/sdk";

const directusUrl = process.env.DIRECTUS_URL || "http://localhost:8055";

export type UseCase = {
  id: string;
  status: string;
  image: string;
  title: string;
  description: string;
  content: string;
  language: "de" | "en";
};

export type Feature = {
  id: string;
  title: string;
  description: string;
  icon: string;
  language: "de" | "en";
};

export type Partner = {
  id: string;
  name: string;
  logo: string;
  link: string;
};

type DirectusCollection = {
  use_cases: UseCase;
  features: Feature;
  partners: Partner;
};

const directus = createDirectus(directusUrl).with(rest());

export async function getDirectusClient() {
  return directus;
}
