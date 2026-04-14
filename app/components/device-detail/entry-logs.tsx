import { useMediaQuery } from '@mantine/hooks'
import { Activity, Clock, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '../ui/dialog'
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from '../ui/drawer'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '../ui/tooltip'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { type LogEntry } from '~/schema/log-entry'

export default function EntryLogs({
	entryLogs = [],
}: {
	entryLogs: LogEntry[]
}) {
	const [open, setOpen] = useState(false)
	const isDesktop = useMediaQuery('(min-width: 768px)')

	if (isDesktop) {
		return (
			<div className="flex flex-col">
				<p className="pb-4 font-bold">Logs</p>
				<div className="flex items-center">
					<div className="flex w-full items-start space-x-4">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-muted-foreground text-muted-foreground">
							<Activity className="h-5 w-5" />
						</div>
						<div className="flex-grow">
							<p className="mb-2 text-sm font-medium">
								{entryLogs[entryLogs.length - 1].content}
							</p>
							<div className="flex items-center text-xs text-muted-foreground">
								<Clock className="mr-1 h-3 w-3" />
								{new Date(entryLogs[0].createdAt).toLocaleString()}
							</div>
						</div>
					</div>
					<div className="shrink">
						<Dialog open={open} onOpenChange={setOpen}>
							<DialogTrigger asChild>
								<Button variant="ghost">
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger>
												{' '}
												<ExternalLink className="ml-2 h-5 w-5" />
											</TooltipTrigger>
											<TooltipContent className="z-auto overflow-visible">
												<p>Show all logs.</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-2/3">
								<DialogHeader>
									<DialogTitle>Device Logs</DialogTitle>
									<DialogDescription>
										If this is your device, you can make changes in your device
										settings.
									</DialogDescription>
								</DialogHeader>
								<LogList entryLogs={entryLogs} />
							</DialogContent>
						</Dialog>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col">
			<p className="pb-4 font-bold">Logs</p>
			<div className="flex items-center">
				<div className="flex w-full items-start space-x-4">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
						<Activity className="h-5 w-5 text-primary-foreground" />
					</div>
					<div className="flex-grow">
						<p className="mb-2 text-sm font-medium">{entryLogs[0].content}</p>
						<div className="flex items-center text-xs text-muted-foreground">
							<Clock className="mr-1 h-3 w-3" />
							{new Date(entryLogs[0].createdAt).toLocaleString()}
						</div>
					</div>
				</div>
				<div className="shrink"></div>
				<Drawer open={open} onOpenChange={setOpen}>
					<DrawerTrigger asChild>
						<Button variant="ghost">
							<ExternalLink className="ml-2 h-5 w-5" />
						</Button>
					</DrawerTrigger>
					<DrawerContent>
						<DrawerHeader className="text-left">
							<DrawerTitle>Device Logs</DrawerTitle>
							<DrawerDescription>
								If this is your device, you can make changes in your device
								settings.
							</DrawerDescription>
						</DrawerHeader>
						<LogList entryLogs={entryLogs} />
						<DrawerFooter className="pt-2">
							<DrawerClose asChild>
								<Button variant="outline">Close</Button>
							</DrawerClose>
						</DrawerFooter>
					</DrawerContent>
				</Drawer>
			</div>
		</div>
	)
}

function LogList({ entryLogs = [] }: { entryLogs: LogEntry[] }) {
	return (
		<ScrollArea className="h-[300px] w-full rounded-md border p-4">
			<div className="space-y-4 pr-4">
				{entryLogs.map((log, index) => (
					<div key={log.id} className="relative flex items-start space-x-4">
						<div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary">
							<Activity className="h-5 w-5 text-primary-foreground" />
						</div>
						<div className="flex-grow">
							<Card className="p-4 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
								<p className="mb-2 text-sm font-medium">{log.content}</p>
								<div className="flex items-center text-xs text-muted-foreground">
									<Clock className="mr-1 h-3 w-3" />
									{new Date(log.createdAt).toLocaleString()}
								</div>
							</Card>
						</div>
						{index < entryLogs.length - 1 && (
							<div
								className="absolute bottom-0 left-5 top-10 w-[1px] bg-border"
								aria-hidden="true"
							/>
						)}
					</div>
				))}
			</div>
		</ScrollArea>
	)
}
