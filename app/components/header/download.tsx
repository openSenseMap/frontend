import { useEffect, useState } from 'react'
import { BBox } from 'geojson'
import debounce from 'lodash.debounce'
import { useMap } from 'react-map-gl'
import { Form, useNavigation, useActionData } from 'react-router'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Download as DownloadIcon } from 'lucide-react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'



// Custom Loading Animation Component
const PulsingDownloadAnimation = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        {/* Main download icon */}
        <div className="text-blue-600 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </div>
        
        {/* Animated ripples */}
        <div className="absolute top-0 left-0 h-full w-full animate-ping rounded-full border-2 border-blue-400 opacity-75"></div>
        <div className="absolute top-0 left-0 h-full w-full animate-pulse rounded-full border border-blue-300 opacity-75" style={{ animationDelay: "0.3s" }}></div>
        
        {/* Small data points moving toward the download icon */}
        <div className="absolute -top-4 -left-4 h-2 w-2 animate-ping rounded-full bg-blue-500" style={{ animationDelay: "0.1s" }}></div>
        <div className="absolute -top-4 left-0 h-2 w-2 animate-ping rounded-full bg-blue-500" style={{ animationDelay: "0.4s" }}></div>
        <div className="absolute -top-4 left-4 h-2 w-2 animate-ping rounded-full bg-blue-500" style={{ animationDelay: "0.7s" }}></div>
      </div>
      <span className="ml-3 text-blue-600 font-medium">Processing data...</span>
    </div>
  );
};

// Data Ready Animation
const DataReadyAnimation = () => {
  return (
    <div className="flex items-center justify-center text-light-blue">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4.3 12 14.01 9 11.01"></polyline>
      </svg>
      <span className="ml-2">Ready to download!</span>
    </div>
  );
};

const DEBOUNCE_VALUE = 50

export default function Download(props: any) {
  const actionData = useActionData()
  const navigation = useNavigation()
  const isLoading = navigation.state === "submitting"
  
  const devices = props.devices.features || []
  const { osem: mapRef } = useMap()

  // the viewport bounds and zoom level
  const [bounds, setBounds] = useState(
    mapRef?.getMap().getBounds().toArray().flat() as BBox,
  )

  const [zoom, setZoom] = useState(mapRef?.getZoom() || 0)
  const [isDownloadReady, setIsDownloadReady] = useState(false)
  const [showReadyAnimation, setShowReadyAnimation] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [link, setLink] = useState<any|null>(null)
  // Update download ready state when actionData changes
  useEffect(() => {
    if (actionData && actionData.error) {
      setErrorMessage(actionData.error)
      setLink(actionData.link)
    } else {
      setErrorMessage(null)
      // Only set download ready if there's no error
      if (actionData) {
        setIsDownloadReady(true)
        setShowReadyAnimation(true)
        const timer = setTimeout(() => {
          setShowReadyAnimation(false)
        }, 2500)
        return () => clearTimeout(timer)
      }
    }
  }, [actionData])

  // Reset download ready state when format changes
  const [format, setFormat] = useState<string>('csv')
  const handleFormatChange = (value: string) => {
    setFormat(value)
    setIsDownloadReady(false)
    setErrorMessage(null);
  }

  const [downloadStarted, setDownloadStarted] = useState(false)

// Add this function to handle download start
const handleDownloadStart = () => {
  setDownloadStarted(true)
  
  // Reset the download started state after a delay
  setTimeout(() => {
    setDownloadStarted(false)
  }, 4000)
}


  // get bounds and zoom level from the map
  const debouncedChangeHandler = debounce(() => {
    if (!mapRef) return
    setBounds(mapRef.getMap().getBounds().toArray().flat() as BBox)
    setZoom(mapRef.getZoom())
    // Reset download state when map changes
    setIsDownloadReady(false)
    setErrorMessage(null)
    setShowReadyAnimation(false)
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
  
  let deviceIDs: Array<string> = [];
  devicesInBounds.map((device: any) => {
    deviceIDs.push(device.properties.id);
  })
  
  const [aggregate, setAggregate] = useState<string>('10m')
  const [fields, setFields] = useState({
    title: true,
    unit: true,
    value: true,
    timestamp: true,
  })

  const handleFieldChange = (field: keyof typeof fields) => {
    setFields((prev) => ({ ...prev, [field]: !prev[field] }))
    setIsDownloadReady(false)
    setErrorMessage(null);
    setShowReadyAnimation(false);
  }
  
  return (
    <Dialog>
      <DialogTrigger asChild className="pointer-events-auto">
        <div className="pointer-events-auto box-border h-10 w-10">
          <button
            type="button"
            className="h-10 w-10 rounded-full border border-gray-100 bg-white text-center text-black hover:bg-gray-100 transition-all hover:shadow-md"
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
        <div className="grid gap-4 py-3">
          <Form action={'/explore'} method='post'>
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor='Devices'>Devices</Label>
                <span className="text-sm text-blue-600 font-medium">{deviceIDs.length} 📡selected</span>
              </div>
              <Input type="text" name='devices' value={deviceIDs} readOnly/>
              <Label htmlFor="format">Format</Label>
              <Select value={format} onValueChange={handleFormatChange} name='format'>
                <SelectTrigger id="format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="txt">Text</SelectItem>
                </SelectContent>
              </Select>
              <Label htmlFor="aggregate">Aggregate to</Label>
              <Select value={aggregate} onValueChange={(value) => { setAggregate(value); setIsDownloadReady(false); setErrorMessage(null); setShowReadyAnimation(false);}} name='aggregate'>
                <SelectTrigger id="aggregate">
                  <SelectValue placeholder="Aggregate to" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="raw">Raw data</SelectItem>
                  <SelectItem value="10m">10 minutes</SelectItem>
                  <SelectItem value="1h">1 hour</SelectItem>
                  <SelectItem value="1d">1 day</SelectItem>
                  <SelectItem value="1m">1 month</SelectItem>
                  <SelectItem value="1y">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 mt-4">
              <Label>Fields to include</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="title"
                    checked={fields.title}
                    onCheckedChange={() => handleFieldChange('title')}
                    name="title"
                  />
                  <Label htmlFor="title" className="cursor-pointer">
                    Title
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="unit"
                    checked={fields.unit}
                    onCheckedChange={() => handleFieldChange('unit')}
                    name="unit"
                  />
                  <Label htmlFor="unit" className="cursor-pointer">
                    Unit
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="value"
                    checked={fields.value}
                    onCheckedChange={() => handleFieldChange('value')}
                    name="value"
                  />
                  <Label htmlFor="value" className="cursor-pointer">
                    Value
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="timestamp"
                    checked={fields.timestamp}
                    onCheckedChange={() => handleFieldChange('timestamp')}
                    name="timestamp"
                  />
                  <Label htmlFor="timestamp" className="cursor-pointer">
                    Timestamp
                  </Label>
                </div>
              </div>
            </div>
            
            <div className="h-16 flex items-center justify-center mt-4">
              {isLoading ? (
                <PulsingDownloadAnimation />
              ) : showReadyAnimation ? (
                <DataReadyAnimation />
              ) : null}
            </div>
            {errorMessage && (
            <div className="mt-2 p-3 bg-red-100 border border-red-300 text-red-700 rounded flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-red-500">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
             </svg>
            <p>{errorMessage}<a href={link} className='text-blue-100' target='_blank'>Click here</a>{" "}to go to archive.</p>
            <img src="https://media1.tenor.com/m/lOECKg5bABIAAAAd/please-don%E2%80%99t-kill-me-don%E2%80%99t-kill-me.gif" alt="" height={'150px'} width={'120px'} className='ms-2 rounded-lg'/>
          </div>
)}
            <DialogFooter>
              <div className="w-full mt-4 flex items-center justify-center gap-4">
                <Button 
                  type="submit" 
                  className="bg-blue-100 hover:bg-blue-200 transition-colors text-dark"
                  disabled={isLoading || deviceIDs.length === 0}
                >
                  {isLoading ? "Processing..." : "Generate File"}
                </Button>
                {actionData && isDownloadReady ? (
                   <a 
                     href={actionData.href} 
                     download={actionData.download}
                     className={`px-4 py-2 ${downloadStarted ? 'bg-blue-300 animate-pulse' : 'bg-green-100'} text-dark rounded hover:bg-green-400 transition-colors flex items-center`}
                      onClick={handleDownloadStart}
                      >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                     </svg>
                     {downloadStarted ? "Downloading..." : `Download ${format.toUpperCase()} Data`}
                      </a>
                          ) : null}
                
                {/* {actionData && isDownloadReady ? (
                  <a 
                    href={actionData.href} 
                    download={actionData.download}
                    className="px-4 py-2 bg-green-100 text-dark rounded hover:bg-green-400 transition-colors flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download {format.toUpperCase()} Data
                  </a>
                ) : null} */}
              </div>
            </DialogFooter>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}