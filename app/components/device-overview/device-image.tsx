import { Image as ImageIcon } from 'lucide-react'

export default function DeviceImage({ image }: { image: string | null }) {
	return (
		<div className="md:w-1/2">
			{image ? (
				<img
					className="w-full rounded-lg object-cover"
					alt="device_image"
					src={image}
				></img>
			) : (
				<div className="w-full rounded-lg object-cover text-muted-foreground">
					<ImageIcon strokeWidth={1} className="h-full w-full" />
				</div>
			)}
		</div>
	)
}
