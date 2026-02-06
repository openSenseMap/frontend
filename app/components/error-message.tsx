import { X } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Alert, AlertDescription } from './ui/alert'

export default function ErrorMessage() {
	let navigate = useNavigate()
	const goBack = () => navigate(-1)

	return (
		<Alert className="w-1/2 dark:bg-zinc-800 dark:text-zinc-200 dark:opacity-95">
			<div className="flex items-center justify-end">
				<X
					className="h-4 w-4 cursor-pointer"
					onClick={() => {
						void goBack()
					}}
				/>
			</div>
			<p className="p-2 text-center text-lg">
				Oh no, this shouldn't happen, but don't worry, our team is on the case!
			</p>
			<AlertDescription>
				<p className="text-md p-2 text-center">Add some info here.</p>
			</AlertDescription>
		</Alert>
	)
}
