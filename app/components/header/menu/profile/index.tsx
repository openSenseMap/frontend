import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

interface ProfileDialogProps {
	isProfileDialogOpen: boolean
	setIsProfileDialogOpen: (value: boolean) => void
}

export default function ProfileDialog(props: ProfileDialogProps) {
	return (
		<div className="w-full">
			<Dialog
				open={props.isProfileDialogOpen}
				onOpenChange={props.setIsProfileDialogOpen}
			>
				<DialogContent className="top-[20%]">
					<DialogHeader>
						<DialogTitle>Profile</DialogTitle>
						<DialogDescription>
							Here you can edit your profile information.
						</DialogDescription>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		</div>
	)
}
