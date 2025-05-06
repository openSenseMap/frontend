import { Save } from 'lucide-react'
import React, { useState } from 'react'
import {
	data,
	redirect,
	Form,
	useActionData,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from 'react-router'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import ErrorMessage from '~/components/error-message'
import { toast } from '~/components/ui/use-toast'
import { checkMqttValidaty } from '~/models/mqtt.server'
import { getUserId } from '~/utils/session.server'

//*****************************************************
export async function loader({ request }: LoaderFunctionArgs) {
	//* if user is not logged in, redirect to home
	const userId = await getUserId(request)
	if (!userId) return redirect('/')

	return ''
}

//*****************************************************
export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData()
	const { enableMQTTcb, mqttURL, mqttTopic } = Object.fromEntries(formData)

	//* ToDo: if mqtt checkbox is not enabled, reset mqtt to default
	if (!enableMQTTcb) {
		return data({
			errors: {
				mqttURL: null,
				mqttTopic: null,
			},
			reset: true,
			isMqttValid: null,
			status: 200,
		})
	}

	const errors = {
		mqttURL: mqttURL ? null : 'Invalid URL (please use ws or wss URL)',
		mqttTopic: mqttTopic ? null : 'Invalid mqtt topic',
	}
	const hasErrors = Object.values(errors).some((errorMessage) => errorMessage)

	if (hasErrors) {
		return data({
			errors: errors,
			reset: false,
			isMqttValid: null,
			status: 400,
		})
	}

	//* check mqtt connection validity
	const isMqttValid = await checkMqttValidaty(mqttURL?.toString() ?? '')

	return data({
		errors: errors,
		reset: false,
		isMqttValid: isMqttValid,
		status: 200,
	})
}

//**********************************
export default function EditBoxMQTT() {
	const [mqttEnabled, setMqttEnabled] = useState(false)
	const [mqttValid, setMqttValid] = useState(true)
	const actionData = useActionData<typeof action>()

	const mqttURLRef = React.useRef<HTMLInputElement>(null)
	const mqttTopicRef = React.useRef<HTMLInputElement>(null)

	React.useEffect(() => {
		if (actionData) {
			const hasErrors = Object.values(actionData?.errors).some(
				(errorMessage) => errorMessage,
			)

			// ToDo
			if (actionData.reset) {
				// Do nothing for now
			} else if (!hasErrors) {
				if (actionData.isMqttValid) {
					setMqttValid(true)
					//* show conn. success msg
					toast({
						description: 'Successfully connected to mqtt url!',
					})
				} else {
					setMqttValid(false)
					mqttURLRef.current?.focus()
				}
			} else if (hasErrors && actionData?.errors?.mqttURL) {
				mqttURLRef.current?.focus()
			} else if (hasErrors && actionData?.errors?.mqttTopic) {
				mqttTopicRef.current?.focus()
			}
		}
	}, [actionData])

	return (
		<div className="grid grid-rows-1">
			<div className="flex min-h-full items-center justify-center">
				<div className="mx-auto w-full font-helvetica text-[14px]">
					{/* Form */}
					<Form method="post" noValidate>
						{/* Heading */}
						<div>
							{/* Title */}
							<div className="mt-2 flex justify-between">
								<div>
									<h1 className=" text-4xl">MQTT</h1>
								</div>
								<div>
									{/* Save button */}
									<button
										type="submit"
										name="intent"
										value="save"
										className=" h-12 w-12 rounded-full border-[1.5px] border-[#9b9494] hover:bg-[#e7e6e6]"
									>
										<Save className="mx-auto h-5 w-5 lg:h-7 lg:w-7" />
									</button>
								</div>
							</div>
						</div>

						{/* divider */}
						<hr className="my-3 mt-6 h-px border-0 bg-[#dcdada] dark:bg-gray-700" />

						<div className="my-5 rounded border border-[#faebcc] bg-[#fcf8e3] p-4 text-[#8a6d3b]">
							<p>
								openSenseMap offers a{' '}
								<a
									href="http://mqtt.org/"
									className="cursor-pointer text-[#4eaf47]"
								>
									MQTT{' '}
								</a>{' '}
								client for connecting to public brokers. Documentation for the
								parameters is provided{' '}
								<a
									href="https://docs.opensensemap.org/#api-Boxes-postNewBox"
									className="cursor-pointer text-[#4eaf47]"
								>
									in the docs.{' '}
								</a>
								Please note that it's only possible to receive measurements
								through MQTT.
							</p>
						</div>

						<div className="my-6 flex items-center space-x-2">
							<Checkbox
								name="enableMQTTcb"
								onCheckedChange={() => setMqttEnabled(!mqttEnabled)}
							/>
							<label
								htmlFor="terms"
								className="cursor-pointer text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								Enable MQTT
							</label>
						</div>

						{/* MQTT URL */}
						<div className="my-2">
							<label
								htmlFor="name"
								className="txt-base block font-bold tracking-normal"
							>
								Url*
							</label>

							<div className="mt-1">
								<input
									id="mqttURL"
									required
									autoFocus={true}
									name="mqttURL"
									type="text"
									ref={mqttURLRef}
									className="w-full rounded border border-gray-200 px-2 py-1 text-base disabled:cursor-not-allowed disabled:bg-[#eee]"
									disabled={!mqttEnabled}
								/>
								{actionData?.errors?.mqttURL && (
									<div className="pt-1 text-[#FF0000]" id="mqttURL-error">
										{actionData.errors.mqttURL}
									</div>
								)}

								{!mqttValid && (
									<div className="pt-1 text-[#FF0000]" id="mqttURL-error">
										Entered mqtt url is not valid, please try again with a valid
										one.
									</div>
								)}
							</div>
						</div>

						{/* MQTT Topic */}
						<div className="my-2">
							<label
								htmlFor="mqttTopic"
								className="txt-base block font-bold tracking-normal"
							>
								Topic*
							</label>

							<div className="mt-1">
								<input
									id="mqttTopic"
									required
									autoFocus={true}
									name="mqttTopic"
									type="text"
									ref={mqttTopicRef}
									className="w-full rounded border border-gray-200 px-2 py-1 text-base disabled:cursor-not-allowed disabled:bg-[#eee]"
									disabled={!mqttEnabled}
								/>
								{actionData?.errors?.mqttTopic && (
									<div className="pt-1 text-[#FF0000]" id="mqttTopic-error">
										{actionData.errors.mqttTopic}
									</div>
								)}
							</div>
						</div>

						{/* MQTT Message format */}
						<div className="my-4">
							<label
								htmlFor="mqttTopic"
								className="txt-base block font-bold tracking-normal"
							>
								Message format*
							</label>
							<div className="mt-1">
								<RadioGroup
									defaultValue="json"
									disabled={!mqttEnabled}
									className="disabled:cursor-not-allowed"
								>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="json" id="r1" />
										<Label htmlFor="r1">json</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="csv" id="r2" />
										<Label htmlFor="r2">csv</Label>
									</div>
								</RadioGroup>
							</div>
						</div>

						{/* MQTT Decoding options */}
						<div className="my-2">
							<label
								htmlFor="mqttDecode"
								className="txt-base block font-bold tracking-normal"
							>
								Decoding options
							</label>

							<div className="mt-1">
								<input
									id="mqttDecode"
									autoFocus={true}
									name="mqttDecode"
									type="text"
									className="w-full rounded border border-gray-200 px-2 py-1 text-base disabled:cursor-not-allowed disabled:bg-[#eee]"
									disabled={!mqttEnabled}
								/>
							</div>
						</div>

						{/* MQTT Decoding options */}
						<div>
							<label
								htmlFor="mqttConn"
								className="txt-base block font-bold tracking-normal"
							>
								Connection options
							</label>

							<div className="mt-1">
								<input
									id="mqttConn"
									name="mqttConn"
									type="text"
									className="w-full rounded border border-gray-200 px-2 py-1 text-base disabled:cursor-not-allowed disabled:bg-[#eee]"
									disabled={!mqttEnabled}
								/>
							</div>
						</div>
					</Form>
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
