import { data, useLoaderData } from 'react-router'
import { getCurrentEffectiveTos } from '~/models/tos.server'

export async function loader() {
  const tos = await getCurrentEffectiveTos()
  if (!tos) return data({ tos: null }, { status: 500 })
  return data({ tos })
}

export default function TermsPage() {
  const { tos } = useLoaderData<typeof loader>()
  if (!tos) return <div className="p-6">No ToS configured.</div>

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">{tos.title}</h1>
      <div className="prose max-w-none whitespace-pre-wrap">{tos.body}</div>
    </div>
  )
}