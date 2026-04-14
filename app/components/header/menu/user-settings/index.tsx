import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

interface UserSettingsDialogProps {
	isSettingsDialogOpen: boolean
	setIsSettingsDialogOpen: (value: boolean) => void
}

export default function UserSettingsDialog(props: UserSettingsDialogProps) {
	return (
		<div className="w-full">
			<Dialog
				open={props.isSettingsDialogOpen}
				onOpenChange={props.setIsSettingsDialogOpen}
			>
				<DialogContent className="top-[20%]">
					<DialogHeader>
						<DialogTitle>Settings</DialogTitle>
						<DialogDescription>
							Here you can edit your user settings
						</DialogDescription>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		</div>
	)
}
