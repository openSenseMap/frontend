import { Save, Trash } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	data,
	redirect,
	Form,
	useActionData,
	useLoaderData,
	useSubmit,
} from 'react-router'

import invariant from 'tiny-invariant'
import { Switch } from '@/components/ui/switch'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import ErrorMessage from '~/components/error-message'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { useToast } from '~/components/ui/use-toast'
import {
	createLogEntry,
	deleteLogEntry,
	getLogEntriesByDeviceId,
	updateLogEntryVisibility,
} from '~/models/log-entry.server'
import { type LogEntry } from '~/schema/log-entry'
import { getUserId } from '~/utils/session.server'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	const deviceID = params.deviceId
	if (typeof deviceID !== 'string') {
		return { logEntries: null }
	}

	const logEntries = await getLogEntriesByDeviceId(deviceID)
	return { logEntries: logEntries }
}

export async function action({ request, params }: ActionFunctionArgs) {
	try {
		const formData = await request.formData()
		const { intent, content, logEntryId, isPublic } =
			Object.fromEntries(formData)

		const deviceID = params.deviceId
		invariant(typeof deviceID === 'string', 'Device ID not found.')

		switch (intent) {
			case 'addLog': {
				invariant(typeof content === 'string', 'Log content is required.')
				await createLogEntry({ deviceId: deviceID, content, public: false })
				return data({
					success: true,
					message: 'Log added successfully!',
				})
			}
			case 'deleteLog': {
				invariant(typeof logEntryId === 'string', 'Log entry ID is required.')
				await deleteLogEntry(logEntryId)
				return data({
					success: true,
					message: 'Log deleted successfully!',
				})
			}
			case 'togglePublic': {
				invariant(typeof logEntryId === 'string', 'Log entry ID is required.')
				invariant(typeof isPublic === 'string', 'Public status is required.')
				await updateLogEntryVisibility(logEntryId, isPublic === 'true')
				return data({
					success: true,
					message: 'Log visibility updated!',
				})
			}
			default:
				return data({ success: false, message: 'Unknown action.' })
		}
	} catch (error) {
		console.error('Error processing action:', error)
		return data(
			{ success: false, message: 'Something went wrong.' },
			{ status: 500 },
		)
	}
}

export default function Logs() {
	const { logEntries } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof action>()
	const { toast } = useToast()
	const [newLogContent, setNewLogContent] = useState('')

	const submit = useSubmit()

	// Show toast or message if actionData contains feedback
	useEffect(() => {
		if (actionData) {
			if (actionData.success) {
				toast({
					title: actionData.message,
					variant: 'success',
				})
			} else {
				toast({
					title: actionData.message,
					variant: 'destructive',
				})
			}
		}
	}, [actionData, toast])

	return (
		<div className="grid grid-rows-1">
			<div className="flex min-h-full items-center justify-center">
				<div className="mx-auto w-full font-helvetica text-[14px]">
					<Form method="post" noValidate className="mb-8">
						{/* Heading */}
						<div>
							{/* Title */}
							<div className="mt-2 flex justify-between">
								<div>
									<h1 className="text-4xl">Device Logs</h1>
								</div>
								<div></div>
							</div>
						</div>

						{/* divider */}
						<hr className="my-3 mt-6 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />
						<div className="flex space-x-2">
							<Input
								name="content"
								placeholder="Enter log content"
								type="text"
								value={newLogContent}
								onChange={(e) => setNewLogContent(e.target.value)}
							/>
							<Button
								type="submit"
								variant={'outline'}
								name="intent"
								value="addLog"
								className="gap-2"
							>
								<Save className="h-4 w-4" />
							</Button>
						</div>
					</Form>

					{logEntries && (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Content</TableHead>
									<TableHead>Created At</TableHead>
									<TableHead>Public</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{logEntries.map((logEntry: LogEntry) => (
									<TableRow key={logEntry.id}>
										<TableCell>{logEntry.content}</TableCell>
										<TableCell>
											{new Date(logEntry.createdAt).toLocaleString()}
										</TableCell>
										<TableCell>
											<Form method="post">
												<input
													type="hidden"
													name="logEntryId"
													value={logEntry.id}
												/>
												<input
													type="hidden"
													name="isPublic"
													value={(!logEntry.public).toString()}
												/>
												<Switch
													checked={logEntry.public}
													onCheckedChange={(event) => {
														const formData = new FormData()
														formData.append('logEntryId', logEntry.id)
														formData.append('isPublic', event.toString())
														formData.append('intent', 'togglePublic')
														void submit(formData, { method: 'post' })
													}}
												/>
												<button
													type="submit"
													name="intent"
													value="togglePublic"
													className="hidden"
												/>
											</Form>
										</TableCell>
										<TableCell>
											<Form method="post" data-log-id={logEntry.id}>
												<input
													type="hidden"
													name="logEntryId"
													value={logEntry.id}
												/>
												<button
													type="submit"
													name="intent"
													value="deleteLog"
													className="text-destructive hover:text-destructive/90"
												>
													<Trash className="h-5 w-5" />
												</button>
											</Form>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</div>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<div className="flex h-full w-full items-center justify-center">
			<ErrorMessage />
		</div>
	)
}
