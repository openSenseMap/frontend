import { XSquare } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'

export default function Compare() {
	const navigate = useNavigate()
	const location = useLocation()

	const compareMode = location.pathname.endsWith('/compare')

	return (
		<>
			{compareMode && (
				<Alert className="absolute bottom-4 left-1/2 right-1/2 w-1/4 -translate-x-1/2 -translate-y-1/2 transform animate-pulse dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95">
					<XSquare
						className="h-4 w-4 cursor-pointer"
						onClick={() => {
							void navigate('/explore')
						}}
					/>
					<AlertTitle>Compare devices</AlertTitle>
					<AlertDescription className="inline">
						Choose a device from the map to compare with.
					</AlertDescription>
				</Alert>
			)}
		</>
	)
}
