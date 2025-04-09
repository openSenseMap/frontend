import { useMap } from 'react-map-gl'
import { Button } from '../ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '../ui/dialog'
import { useEffect, useState } from 'react'
import { BBox } from 'geojson'
import { Download as DownloadIcon } from 'lucide-react'
import { Label } from '../ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import debounce from 'lodash.debounce'
import { Device } from '~/schema'
import { Form, useActionData } from 'react-router'
import { string } from 'zod'
import { Input } from '../ui/input'

const DEBOUNCE_VALUE = 50

export default function Download(props: any) {
	const devices = props.devices.features || []
	const { osem: mapRef } = useMap()

	// the viewport bounds and zoom level
	const [bounds, setBounds] = useState(
		mapRef?.getMap().getBounds().toArray().flat() as BBox,
	)

	const [zoom, setZoom] = useState(mapRef?.getZoom() || 0)

	// get bounds and zoom level from the map
	// debounce the change handler to prevent too many updates
	const debouncedChangeHandler = debounce(() => {
		if (!mapRef) return
		setBounds(mapRef.getMap().getBounds().toArray().flat() as BBox)
		setZoom(mapRef.getZoom())
	}, DEBOUNCE_VALUE)

	// register the debounced change handler to map events
	useEffect(() => {
		if (!mapRef) return

		mapRef?.getMap().on('load', debouncedChangeHandler)
		mapRef?.getMap().on('zoom', debouncedChangeHandler)
		mapRef?.getMap().on('move', debouncedChangeHandler)
		mapRef?.getMap().on('resize', debouncedChangeHandler)
	}, [debouncedChangeHandler, mapRef])

	// Filter devices inside the current bounds
	const devicesInBounds =
		bounds && bounds.length === 4
			? devices.filter((device: any) => {
					// Ensure the device has coordinates
					if (!device.geometry || !device.geometry.coordinates) return false

					const [longitude, latitude] = device.geometry.coordinates

					// Check if bounds are defined properly
					const [minLon, minLat] = bounds.slice(0, 2) // [minLongitude, minLatitude]
					const [maxLon, maxLat] = bounds.slice(2, 4) // [maxLongitude, maxLatitude]

					return (
						longitude >= minLon &&
						longitude <= maxLon &&
						latitude >= minLat &&
						latitude <= maxLat
					)
				})
			: []
	console.log('🚀 ~ Download ~ devicesInBounds:', devicesInBounds.length)
	console.log(devicesInBounds);
	let deviceIDs:Array<string> = [];
	devicesInBounds.map((device:any)=>{
		deviceIDs.push(device.properties.id);
	})
	console.log(deviceIDs);
	
	const [format, setFormat] = useState<string>('csv')
	const [fields, setFields] = useState({
		title: true,
		unit: true,
		value: true,
		timestamp: true,
	})

	const handleFieldChange = (field: keyof typeof fields) => {
		setFields((prev) => ({ ...prev, [field]: !prev[field] }))
	}

	function handleDownload() {
		// Logic to download the profile
		console.log('Downloading profile...')
		console.log('Bounds:', bounds)
		console.log(devicesInBounds)
	}
	
	return (
		<Dialog>
			<DialogTrigger asChild className="pointer-events-auto">
				<div className="pointer-events-auto box-border h-10 w-10">
					<button
						type="button"
						className="h-10 w-10 rounded-full border border-gray-100 bg-white text-center text-black hover:bg-gray-100"
					>
						<DownloadIcon className="mx-auto h-6 w-6" />
					</button>
				</div>
			</DialogTrigger>
			<DialogContent className="max-w-1/2">
				<DialogHeader>
					<DialogTitle>Download Options</DialogTitle>
					<DialogDescription>
						Choose your preferred format and select which fields to include in
						the download.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
				  <Form method='post' action='/explore/$deviceId'>
					<div className="grid gap-2">
						<Label htmlFor='Devices'>Devices</Label>
						<Input type="text" name='devices' value={deviceIDs} readOnly/>
						<Label htmlFor="format">Format</Label>
						<Select value={format} onValueChange={setFormat} name='format'>
							<SelectTrigger id="format">
								<SelectValue placeholder="Select format" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="csv">CSV</SelectItem>
								<SelectItem value="json">JSON</SelectItem>
								<SelectItem value="txt">Text</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="grid gap-2">
						<Label>Fields to include</Label>
						<div className="grid grid-cols-2 gap-3">
							<div className="flex items-center space-x-2">
								<Checkbox
									id="title"
									checked={fields.title}
									onCheckedChange={() => handleFieldChange('title')}
								name='title'/>
								<Label htmlFor="title" className="cursor-pointer">
									Title
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Checkbox
									id="unit"
									checked={fields.unit}
									onCheckedChange={() => handleFieldChange('unit')}
								name='unit'/>
								<Label htmlFor="unit" className="cursor-pointer">
									Unit
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Checkbox
									id="value"
									checked={fields.value}
									onCheckedChange={() => handleFieldChange('value')}
								name='value'/>
								<Label htmlFor="value" className="cursor-pointer">
									Value
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Checkbox
									id="timestamp"
									checked={fields.timestamp}
									onCheckedChange={() => handleFieldChange('timestamp')}
								name='timestamp'/>
								<Label htmlFor="timestamp" className="cursor-pointer">
									Timestamp
								</Label>
							</div>
						</div>
					</div>
					<div className='w-full mt-3 items-center justify-center space-x-2'>
						<Button type='submit'>Download</Button>
					</div>
					</Form>
				</div>
				<DialogFooter>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
