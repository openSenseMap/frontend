// import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '../ui/card'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select'

const dummyBoxes = [
	{
		name: 'Box at IFGI',
		id: '1',
		image: '/sensebox_outdoor.jpg',
	},
	{
		name: 'senseBox at Aasee',
		id: '2',
		image: 'https://picsum.photos/200/300',
	},
	{
		name: 'Box at Schlossgarten',
		id: '3',
		image: 'https://picsum.photos/200/300',
	},
]

export default function ProfileBoxSelection() {
	//   const [selectedBox, setSelectedBox] = useState(dummyBoxes[0]);
	return (
		<div>
			{/* this is all jsut dummy data - the real data will be fetched from the API as soon as the route is implemented */}
			<Card>
				<CardHeader>
					<CardTitle>{dummyBoxes[0].name}</CardTitle>
					<CardDescription>Last activity: 13min ago</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center">
						<img
							className="max-h-24 max-w-24 rounded-lg"
							alt=""
							src={dummyBoxes[0].image}
						></img>
					</div>
				</CardContent>
				<CardFooter className="flex items-center justify-center">
					<Select disabled={true}>
						<SelectTrigger className="">
							<SelectValue placeholder="Box at IFGI" />
						</SelectTrigger>
						<SelectContent position="popper" sideOffset={-250}>
							<SelectItem value="light">Light</SelectItem>
							<SelectItem value="dark">Dark</SelectItem>
							<SelectItem value="system">System</SelectItem>
						</SelectContent>
					</Select>
				</CardFooter>
			</Card>
		</div>
	)
}
