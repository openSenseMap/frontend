import { ArrowLeft, Upload } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { redirect, Form, Link, type LoaderFunctionArgs } from 'react-router'
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
import { getUserId } from '~/utils/session.server'

export async function loader({ request }: LoaderFunctionArgs) {
	//* if user is not logged in, redirect to home
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	return {}
}

export async function action() {
	return {}
}

export default function DataUpload() {
	const { t } = useTranslation('csv-upload')
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
								<Link to="/profile/me">{t('backToDashboardNavText')}</Link>
							</li>
						</ul>
					</nav>

					<main className="col-span-6 md:col-span-6">
						<Form method="post" noValidate>
							<div className="container mx-auto max-w-3xl px-4 py-12">
								<h1 className="mb-6 text-3xl font-bold">Manual Data Upload</h1>
								<div className="mb-8 rounded-md bg-muted p-4 text-muted-foreground">
									<p>
										Here you can upload measurements for this senseBox. This can
										be of use for senseBoxes that log their measurements to an
										SD card when no means of direct communication to
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
												Upload File
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
										id="measurement-data"
										placeholder="Paste measurement data here..."
										className="h-[300px]"
										defaultValue={measurementData.slice(0, 3000)} // Displaying only the first 3000 characters
									/>
									{measurementData.length > 1000 && (
										<div className="mt-2 text-sm text-gray-500">
											{`Showing first 1000 characters of ${measurementData.length}`}
										</div>
									)}
								</div>
								<Button type="submit" className="w-full">
									Upload
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
