import { Directus, type ID  } from '@directus/sdk';

const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055'

export type UseCase = {
    id: ID,
    status: string,
    image: string,
    title: string,
    description: string,
    content: string,
    language: "de" | "en"
}

export type Feature = {
    id: ID,
    title: string,
    description: string,
    icon: string,
    language: "de" | "en"
}

export type Partner = {
    id: ID,
    name: string,
    logo: string,
    link: string
}

type DirectusCollection = {
    use_cases: UseCase,
    features: Feature,
    partners: Partner
}

const directus = new Directus<DirectusCollection>(directusUrl)

export async function getDirectusClient () {
    return directus
}