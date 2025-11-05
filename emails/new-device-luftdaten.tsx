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
import { NewDeviceEmailProps } from './new-device'

const messages = {
	en: {
		preview: 'Your device on openSenseMap',
		heading: 'Your device on openSenseMap',
		hello: 'Hello',
		description:
			'Thank you for registering your particulate matter sensor {deviceName} on openSenseMap!',
		hint: "🎉 Now, you have to configure your device in order to submit measurements to the openSenseMap. You'll find instructions to do so on",
		thanks: 'Thank you very much for contributing!',
		deviceId: 'Your senseBox ID is:',
		opensensemapHint: 'You can view your device at this location:',
		support: 'If you have any questions, feel free to write us an email to:',
		salutation: 'The openSenseMap team wishes you a lot of fun',
	},
	de: {
		preview: 'Dein neues Gerät auf der openSenseMap',
		heading: 'Dein neues Gerät auf der openSenseMap',
		hello: 'Hallo',
		description:
			'vielen Dank für die Registrierung deines Feinstaubsensors {deviceName} auf der openSenseMap!',
		hint: '🎉 Damit deine Daten auch die openSenseMap erreichen, musst du noch deinen Feinstaubsensor konfigurieren. Eine Anleitung findest du unter',
		thanks: 'Vielen lieben Dank, dass du dich am Projekt beteiligst.',
		deviceId: 'Deine senseBox-ID lautet:',
		opensensemapHint:
			'Du findest deine Station auf der openSenseMap unter dieser Adresse:',
		support: 'Wenn Du Fragen hast schreib uns eine Mail an:',
		salutation: 'Viel Spaß wünscht dein openSenseMap Team',
	},
}

const baseUrl = process.env.OSEM_URL
	? `https://${process.env.OSEM_URL}`
	: 'https://opensensemap.org'

export const NewDeviceLuftdatenEmail = ({
	user = { name: 'Max Mustermann' },
	device = { id: '1234567890', name: 'Luftdaten Test Gerät' },
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
					<Text>
						{intl.formatMessage({ id: 'hello' })} {user.name},
					</Text>
					<Text>
						{intl.formatMessage(
							{ id: 'description' },
							{ deviceName: device.name },
						)}
					</Text>
					<Text>
						{intl.formatMessage({ id: 'hint' })}{' '}
						<Link
							href="https://tutorials.opensensemap.org/devices/devices-luftdaten/"
							target="_blank"
						>
							https://tutorials.opensensemap.org/devices/devices-luftdaten/
						</Link>
						.
					</Text>
					<Text>{intl.formatMessage({ id: 'thanks' })}</Text>
					<Text>
						{intl.formatMessage({ id: 'deviceId' })} <b>{device.id}</b>
					</Text>
					<Text>{intl.formatMessage({ id: 'opensensemapHint' })}</Text>
					<Link
						href={`${baseUrl}/explore/${device.id}`}
						target="_blank"
					>{`${baseUrl}/explore/${device.id}`}</Link>
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

export default NewDeviceLuftdatenEmail

export const subject = {
	de: 'Dein neues Gerät auf der openSenseMap',
	en: 'Your device on openSenseMap',
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
