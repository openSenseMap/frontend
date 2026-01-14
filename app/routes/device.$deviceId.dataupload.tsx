import { ArrowLeft, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
	redirect,
	Form,
	Link,
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from 'react-router'
import ErrorMessage from '~/components/error-message'
import { NavBar } from '~/components/nav-bar'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { postNewMeasurements } from '~/lib/measurement-service.server'
import { findAccessToken } from '~/models/device.server'
import { StandardResponse } from '~/utils/response-utils'
import { getUserId } from '~/utils/session.server'

export async function loader({ request }: LoaderFunctionArgs) {
	//* if user is not logged in, redirect to home
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	return {}
}

export async function action({ request, params }: ActionFunctionArgs) {
	const method = request.method
	switch (method.toUpperCase()) {
		case 'POST':
			const deviceId = params['deviceId']
			if (deviceId === undefined)
				return StandardResponse.badRequest(
					'deviceId must be set but is undefined',
				)

			const formData = await request.formData()
			if (!formData.has('contentType'))
				return StandardResponse.badRequest('contentType is not set')
			const contentType = formData.get('contentType')!.toString()

			if (!formData.has('measurement-data'))
				return StandardResponse.badRequest('measurement data is not set')
			const measurementData = formData.get('measurement-data')!.toString()

			const deviceApiKey = await findAccessToken(deviceId)

			try {
				await postNewMeasurements(deviceId, measurementData, {
					contentType,
					luftdaten: false,
					hackair: false,
					authorization: deviceApiKey?.token ?? '',
				})
			} catch (err: any) {
				// Handle different error types
				if (err.name === 'UnauthorizedError')
					return StandardResponse.unauthorized(err.message)

				if (
					err.name === 'ModelError' &&
					err.type === 'UnprocessableEntityError'
				)
					return StandardResponse.unprocessableContent(err.message)

				if (err.name === 'UnsupportedMediaTypeError')
					return StandardResponse.unsupportedMediaType(err.message)

				return StandardResponse.internalServerError(
					err.message || 'An unexpected error occurred',
				)
			}

			break
	}
}

export default function DataUpload() {
	// Max number of characters to show for data
	// thats input to the text area
	const DATA_CUTOFF_CHARS = 3_000
	const { t } = useTranslation(['csv-upload', 'common'])
	const textareaRef = useRef<HTMLTextAreaElement | null>(null)
	const [measurementData, setMeasurementData] = useState('')
	const [dataFormat, setDataFormat] = useState('CSV')

	return (
		<div className="space-y-6 px-10 pb-16 font-helvetica">
			<NavBar />

			<div>
				<div className="grid grid-cols-8 gap-10 font-helvetica text-[15px] tracking-wide max-md:grid-cols-2 lg:grid-rows-1">
					<nav className="col-span-2 md:col-span-2">
						<ul>
							<li className="rounded p-3 text-[#676767] hover:bg-[#eee]">
								<ArrowLeft className="mr-2 inline h-5 w-5" />
								<Link to="/profile/me">
									{t('common:backToDashboardNavText')}
								</Link>
							</li>
						</ul>
					</nav>

					<main className="col-span-6 md:col-span-6">
						<Form method="post" noValidate>
							<div className="container mx-auto max-w-3xl px-4 py-12">
								<h1 className="mb-6 text-3xl font-bold">
									{t('dataUploadHeading')}
								</h1>
								<div className="mb-8 rounded-md bg-muted p-4 text-muted-foreground">
									<p>
										<Trans t={t} i18nKey="dataUploadExplanation">
											Here you can upload measurements for this senseBox. This
											can be of use for senseBoxes that log their measurements
											to an SD card when no means of direct communication to
											openSenseMap are available. Either select a file, or copy
											the data into the text field. Accepted data formats are
											described{' '}
											<a
												href="https://docs.opensensemap.org/#api-Measurements-postNewMeasurements"
												className="underline"
											>
												here
											</a>
											.
										</Trans>
									</p>
								</div>
								<div className="mb-8 grid grid-cols-2 gap-4">
									<div>
										<Button
											variant="outline"
											className="relative w-full dark:bg-dark-boxes"
										>
											<Label
												htmlFor="fileInput"
												className="flex h-full w-full cursor-pointer items-center justify-center"
											>
												{t('uploadFileLabel')}
											</Label>
											<Input
												type="file"
												id="fileInput"
												accept="text/csv,application/json,application/vnd.ms-excel"
												className="absolute inset-0 cursor-pointer opacity-0 dark:bg-dark-boxes"
												onChange={(e) => {
													const file = e.currentTarget.files?.[0]
													if (file) {
														setDataFormat(file.type)
														const reader = new FileReader()
														reader.onload = (event) => {
															const fileContent =
																event.target?.result?.toString()
															if (fileContent) setMeasurementData(fileContent)
														}
														reader.readAsText(file)
													}
												}}
											/>
										</Button>
									</div>
									<div>
										<Select
											onValueChange={(value) => setDataFormat(value as string)}
											defaultValue={dataFormat ?? 'CSV'}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select format" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="JSON">JSON</SelectItem>
												<SelectItem value="CSV">CSV</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
								<div className="mb-8">
									<Textarea
										ref={textareaRef}
										id="measurement-data"
										name="measurement-data"
										placeholder={t('inputTextAreaPlaceholder')}
										className="h-[300px]"
										onChange={(e) => setMeasurementData(e.target.value)}
										value={measurementData.slice(0, DATA_CUTOFF_CHARS)}
									/>
									{measurementData.length > DATA_CUTOFF_CHARS && (
										<div className="mt-2 text-sm text-gray-500">
											{t('textAreaCutoffHint', {
												length: measurementData.length,
											})}
										</div>
									)}
									<input type="hidden" name="contentType" value={dataFormat} />
								</div>
								<Button
									type="submit"
									className="w-full"
									disabled={measurementData.length === 0}
								>
									{t('uploadButtonLabel')}
									<Upload className="ml-2 inline h-5 w-5" />
								</Button>
							</div>
						</Form>
					</main>
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
