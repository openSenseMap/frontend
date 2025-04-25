import {type BBox } from 'geojson'
import { Download as DownloadIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { toast } from '../ui/use-toast'

// Custom Loading Animation Component
const PulsingDownloadAnimation = () => {
  const { t } = useTranslation('download')
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
      <span className="ml-3 text-blue-600 font-medium">{t('processingData')}</span>
    </div>
  );
};

// Data Ready Animation
const DataReadyAnimation = () => {
  const { t } = useTranslation('download') 
  return (
    <div className="flex items-center justify-center text-light-blue">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4.3 12 14.01 9 11.01"></polyline>
      </svg>
      <span className="ml-2">{t('readyToDownload')}</span>
    </div>
  );
};
 
export default function Download(props: any) {
  const { t } = useTranslation('download')
  const actionData = useActionData()
  const navigation = useNavigation()
  const isLoading = navigation.state === "submitting"  
  const devices = props.devices.features || []
  const { osem: mapRef } = useMap()

  const [isDownloadReady, setIsDownloadReady] = useState(false)
  const [showReadyAnimation, setShowReadyAnimation] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Update download ready state when actionData changes
  useEffect(() => {
    if (actionData && actionData.error) {
      setErrorMessage(actionData.error)
    } else {
      setErrorMessage(null)
      // Only set download ready if there's no error
      if (actionData) {
        setIsDownloadReady(true)
        setShowReadyAnimation(true)
      }
    }
  }, [actionData])

  // Reset download ready state when format changes
  const [format, setFormat] = useState<string>('csv')
  const handleFormatChange = (value: string) => {
    setFormat(value)
    setShowReadyAnimation(false)
    setIsDownloadReady(false)
    setErrorMessage(null);
  }

  const [downloadStarted, setDownloadStarted] = useState(false)

// Add this function to handle download start
const handleDownloadStart = () => {
  const Delay = 3500;
  setDownloadStarted(true)
  setShowReadyAnimation(false)
  toast({
    description: t('toast'),
    duration: Delay,
    variant:"success"
  })
  
  // Reset the download started state after a delay
  setTimeout(() => {
    setDownloadStarted(false)
    setOpen(false)
  }, Delay)
}

  // Filter devices inside the current bounds
  const bounds = mapRef?.getMap().getBounds().toArray().flat() as BBox ?? undefined;
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
  const [open, setOpen] = useState(false)
  const handleFieldChange = (field: keyof typeof fields) => {
    setFields((prev) => ({ ...prev, [field]: !prev[field] }))
    setIsDownloadReady(false)
    setErrorMessage(null);
    setShowReadyAnimation(false);
  }
  
  return (
    <Dialog open={open} onOpenChange={()=>{
      setOpen(!open);
      setIsDownloadReady(false);
      setErrorMessage(null);
      setShowReadyAnimation(false);}}>
      <DialogTrigger asChild className="pointer-events-auto" onClick={()=>setOpen(true)}>
        <div className="pointer-events-auto box-border h-10 w-10">
          <button
            type="button"
            className="h-10 w-10 rounded-full border border-green-700 bg-white text-center text-black hover:bg-slate-50 transition-all hover:shadow-md"
            aria-label={t('download')}
          >
            <DownloadIcon className="mx-auto h-6 w-6" />
          </button>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-1/2" style={{ maxHeight: '100vh', overflowY: 'auto' }}>
        <DialogHeader>
          <DialogTitle>{t('downloadOptions')}</DialogTitle>
          <DialogDescription>
          {t('downloadDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-3">
          <Form action={'/explore'} method='post'>
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor='Devices'>{t('devices')}</Label>
                <span className="text-sm text-blue-600 font-medium">{deviceIDs.length} 📡 {t('selected')}</span>
              </div>
              <Input type="text" id='devices' name='devices' value={deviceIDs} readOnly/>
              <Label htmlFor="format">{t('format')}</Label>
              <Select value={format} onValueChange={handleFormatChange} name='format'>
                <SelectTrigger id="format">
                  <SelectValue placeholder={t('selectFormat')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="txt">{t('text')}</SelectItem>
                </SelectContent>
              </Select>
              <Label htmlFor="aggregate">{t('aggregateTo')}</Label>
              <Select value={aggregate} onValueChange={(value) => { setAggregate(value); setIsDownloadReady(false); setErrorMessage(null); setShowReadyAnimation(false);}} name='aggregate'>
                <SelectTrigger id="aggregate">
                  <SelectValue placeholder={t('aggregateTo')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="raw">{t('rawData')}</SelectItem>
                  <SelectItem value="10m">{t('10minutes')}</SelectItem>
                  <SelectItem value="1h">{t('1hour')}</SelectItem>
                  <SelectItem value="1d">{t('1day')}</SelectItem>
                  <SelectItem value="1m">{t('1month')}</SelectItem>
                  <SelectItem value="1y">{t('1year')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 mt-4">
              <Label htmlFor='fields'>{t('fieldsToInclude')}</Label>
              <div className="grid grid-cols-2 gap-3" id='fields'>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="title"
                    checked={fields.title}
                    onCheckedChange={() => handleFieldChange('title')}
                    name="title"
                  />
                  <Label htmlFor="title" className="cursor-pointer">
                  {t('title')}
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
                  {t('unit')}
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
                  {t('value')}
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
                  {t('timestamp')}
                  </Label>
                </div>
              </div>
            </div>
            
            <div className="h-16 flex items-center justify-center mt-2">
              {isLoading ? (
                <PulsingDownloadAnimation />
              ) : showReadyAnimation ? (
                <DataReadyAnimation />
              ) : null}
            </div>
            {errorMessage && (
            <div className="p-2 bg-red-100 border border-red-300 text-red-700 rounded flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-red-500 animate-pulse">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
             </svg>
            <p>{t('error')} <a href={actionData?.link} className='text-blue-100' target='_blank'>{t('clickHere')}</a>{" "} {t('toGoToArchive')}</p>
          </div>
)}
            <DialogFooter>
              <div className="w-full mt-4 flex items-center justify-center space-x-4">
                <Button 
                  type="submit" 
                  className="bg-blue-100 hover:bg-blue-200 transition-colors text-dark"
                  disabled={isLoading || deviceIDs.length === 0}
                >
                  {isLoading ? t('processing') : t('generateFile')}
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
                     {downloadStarted ? t('downloading') : `${format.toUpperCase()} ${t('data')} ${t('download')}`}
                      </a>
                          ) : null}
              </div>
            </DialogFooter>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}