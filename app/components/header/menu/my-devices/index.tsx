import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

interface MyDevicesDialogProps {
	isMyDevicesDialogOpen: boolean
	setIsMyDevicesDialogOpen: (value: boolean) => void
}

export default function MyDevicesDialog(props: MyDevicesDialogProps) {
	return (
		<div className="w-full">
			<Dialog
				open={props.isMyDevicesDialogOpen}
				onOpenChange={props.setIsMyDevicesDialogOpen}
			>
				<DialogContent className="top-[20%]">
					<DialogHeader>
						<DialogTitle>My Devices</DialogTitle>
						<DialogDescription>
							Here you can see all your devices.
						</DialogDescription>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		</div>
	)
}
