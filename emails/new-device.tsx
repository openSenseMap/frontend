import { createIntl } from '@formatjs/intl'
import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Link,
	Preview,
	Text,
} from '@react-email/components'

const messages = {
	en: {
		preview: 'Your device on openSenseMap',
		heading: 'Your device on openSenseMap',
		hello: 'Hello',
		description:
			'your senseBox { deviceName } is now registered at openSenseMap! 🎉 Thank you very much for contributing!',
		thanks: 'Thank you very much for contributing!',
		deviceId: 'Your senseBox ID is:',
		opensensemapHint: 'You can view your device at this location:',
		support: 'If you have any questions, feel free to write us an email to:',
		attachment:
			'Please note your personal Arduino Sketch in the attachment of this mail. If you have registered a senseBox with WiFi-Bee make sure you set your WiFi credentials in the arduino sketch, so your senseBox can connect to the internet. You can find further instructions',
		attachmentLink: 'here',
		attachmentSuffix: 'in the First steps of our senseBox:home book.',
		salutation: 'The openSenseMap team wishes you a lot of fun',
	},
	de: {
		preview: 'Dein neues Gerät auf der openSenseMap',
		heading: 'Dein neues Gerät auf der openSenseMap',
		hello: 'Hallo',
		description:
			'deine senseBox mit dem Namen { deviceName } ist nun auf der openSenseMap angemeldet! 🎉 Vielen lieben Dank, dass du dich am Projekt beteiligst.',
		thanks: 'Vielen lieben Dank, dass du dich am Projekt beteiligst.',
		deviceId: 'Deine senseBox-ID lautet:',
		opensensemapHint:
			'Du findest deine Station auf der openSenseMap unter dieser Adresse:',
		support: 'Wenn Du Fragen hast schreib uns eine Mail an:',
		attachment:
			'Im Anhang befindet sich dein persönlicher Arduino Sketch. Falls du eine senseBox mit WiFi-Bee registriert hast, denke unbedingt daran dein WiFi-Netzwerknamen und das Passwort in den Arduino Sktech einzufügen, damit sich deine senseBox mit dem Internet verbinden kann. Eine Anleitung wie es damit weitergeht, findest du',
		attachmentLink: 'hier',
		attachmentSuffix: 'in der Dokumentation.',
		salutation: 'Viel Spaß wünscht dein openSenseMap Team',
	},
}

interface User {
	name: string
}

interface Device {
	id: string
	name: string
}

export interface NewDeviceEmailProps {
	user: User
	device: Device
	language: 'de' | 'en'
}

const baseUrl = process.env.OSEM_URL
	? `https://${process.env.OSEM_URL}`
	: 'https://opensensemap.org'

export const NewDeviceEmail = ({
	user = { name: 'Max Mustermann' },
	device = { id: '1234567890', name: 'senseBox Test Gerät' },
	language = 'en',
}: NewDeviceEmailProps) => {
	const intl = createIntl({
		locale: language,
		messages: messages[language],
	})

	return (
		<Html lang={language} dir="ltr">
			<Head />
			<Preview>{intl.formatMessage({ id: 'preview' })}</Preview>
			<Body style={main}>
				<Container style={container}>
					<Heading style={h1}>{intl.formatMessage({ id: 'heading' })}</Heading>
					<Text>Hallo {user.name},</Text>
					<Text>
						{intl.formatMessage(
							{ id: 'description' },
							{ deviceName: device.name },
						)}
					</Text>
					<Text>
						{intl.formatMessage({ id: 'deviceId' })} <b>{device.id}</b>
					</Text>
					<Text>{intl.formatMessage({ id: 'opensensemapHint' })}</Text>
					<Link
						href={`${baseUrl}/explore/${device.id}`}
						target="_blank"
					>{`${baseUrl}/explore/${device.id}`}</Link>
					<Text>
						{intl.formatMessage({ id: 'attachment' })}{' '}
						<Link href="https://docs.sensebox.de/docs/products/home/aufbau/home-schritt-1">
							{intl.formatMessage({ id: 'attachmentLink' })}
						</Link>{' '}
						{intl.formatMessage({ id: 'attachmentSuffix' })}
					</Text>
					<Text>
						{intl.formatMessage({ id: 'support' })} {}
						<Link
							href={`mailto:support@sensebox.de?Subject=Hilfe%20bei%20der%20Einrichtung&body=Bitte%20bei%20jeder%20Anfrage%20die%20senseBox-ID%20(${device.id})%20mit%20angeben.%20Danke!`}
						>
							support@sensebox.de
						</Link>
					</Text>
					<Text>{intl.formatMessage({ id: 'salutation' })}</Text>
				</Container>
			</Body>
		</Html>
	)
}

export default NewDeviceEmail

export const subject = {
	de: 'Deine senseBox auf der openSenseMap',
	en: 'Your new senseBox on openSenseMap',
}

const main = {
	backgroundColor: '#ffffff',
}

const container = {
	paddingLeft: '12px',
	paddingRight: '12px',
	margin: '0 auto',
}

const h1 = {
	color: '#333',
	fontFamily:
		"-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
	fontSize: '24px',
	fontWeight: 'bold',
	margin: '40px 0',
	padding: '0',
}

const link = {
	color: '#2754C5',
	fontFamily:
		"-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
	fontSize: '14px',
	textDecoration: 'underline',
}

const text = {
	color: '#333',
	fontFamily:
		"-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
	fontSize: '14px',
	margin: '24px 0',
}

const code = {
	display: 'inline-block',
	padding: '16px 4.5%',
	width: '90.5%',
	backgroundColor: '#f4f4f4',
	borderRadius: '5px',
	border: '1px solid #eee',
	color: '#333',
}
