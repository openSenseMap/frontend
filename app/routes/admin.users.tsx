import  { Outlet } from 'react-router'
import  { type Route } from './+types/admin.devices'
import { requireAdmin } from '~/utils/session.server'


export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request)
  return null
}

export default function AdminDevicesLayoutRoute() {
  return (
    <main className="container mx-auto p-4">
      <Outlet />
    </main>
  )
}