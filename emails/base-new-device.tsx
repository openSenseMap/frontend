import { createIntl } from '@formatjs/intl'
import {
	Html,
	Head,
	Heading,
	Preview,
	Body,
	Container,
	Text,
	Link,
} from '@react-email/components'

export interface BaseNewDeviceEmailProps {
	user: {
		name: string
	}
	device: {
		id: string
		name: string
	}
	language: 'de' | 'en'
	content: typeof messages
}

export const messages = {
	en: {
		heading: 'Your device on openSenseMap',
		greeting: 'Hello',
		mainText:
			'your device "{ deviceName }" is now registered on openSenseMap! 🎉 Thank you very much for contributing!',
		yourDevice: 'Your device ID is: ',
		viewDeviceAt: 'You can view your device at this location: ',
		support:
			'If you have any questions, feel free to reach out on GitHub or write an email to: ',
		closing: 'The openSenseMap team wishes you a lot of fun',
		attachment: '',
		attachmentLink: '',
		attachmentLinkText: '',
		attachmentSuffix: '',
	},
	de: {
		heading: 'Dein neues Gerät auf der openSenseMap',
		greeting: 'Hallo',
		mainText:
			'dein Gerät mit dem Namen "{ deviceName }" ist nun auf der openSenseMap angemeldet! 🎉 Vielen Dank, dass du dich am Projekt beteiligst.',
		yourDevice: 'Deine Geräte-ID lautet: ',
		viewDeviceAt:
			'Du findest deine Station auf der openSenseMap unter dieser Adresse: ',
		support:
			'Wenn Du Fragen hast, kontaktiere uns über GitHub oder schreib uns eine Mail an: ',
		closing: 'Viel Spaß wünscht dein openSenseMap Team',
		attachment: '',
		attachmentLink: '',
		attachmentLinkText: '',
		attachmentSuffix: '',
	},
}

const baseUrl = process.env.OSEM_URL
	? `https://${process.env.OSEM_URL}`
	: 'https://opensensemap.org'

export const BaseNewDeviceEmail = ({
	user = { name: 'Erika Mustermann' },
	device = { id: '12345678', name: 'test device' },
	language = 'en',
	content = messages,
}: BaseNewDeviceEmailProps) => {
	const i = createIntl({
		locale: language,
		messages: content[language],
	})

	return (
		<Html lang={language} dir="ltr">
			<Head />
			<Preview>{i.formatMessage({ id: 'heading' })}</Preview>
			<Body
				style={{
					backgroundColor: '#ffffff',
					fontFamily:
						"-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
				}}
			>
				<Container style={{ paddingInline: '12px', margin: '0 auto' }}>
					<Heading
						style={{
							color: '#333',
							fontSize: '24px',
							fontWeight: 'bold',
							margin: '40px 0',
							padding: '0',
						}}
					>
						{i.formatMessage({ id: 'heading' })}
					</Heading>
					<Text>
						{i.formatMessage({ id: 'greeting' })} {user.name},
					</Text>
					<Text>
						{i.formatMessage({ id: 'mainText' }, { deviceName: device.name })}
					</Text>
					<Text>
						{i.formatMessage({ id: 'yourDevice' })}
						<b>{device.id}</b>
					</Text>
					<Text>
						{i.formatMessage({ id: 'viewDeviceAt' })}
						<br />
						<Link
							style={{
								color: '#2754C5',
								fontSize: '14px',
								textDecoration: 'underline',
							}}
							href={`${baseUrl}/explore/${device.id}`}
							target="_blank"
						>{`${baseUrl}/explore/${device.id}`}</Link>
					</Text>
					{messages.en.attachment && (
						<Text>
							{i.formatMessage({ id: 'attachment' })}{' '}
							<Link
								style={{
									color: '#2754C5',
									fontSize: '14px',
									textDecoration: 'underline',
								}}
								href={i.formatMessage({ id: 'attachmentLink' })}
							>
								{i.formatMessage({ id: 'attachmentLinkText' })}
							</Link>{' '}
							{i.formatMessage({ id: 'attachmentSuffix' })}
						</Text>
					)}
					<Text>
						{i.formatMessage({ id: 'support' })} {}
						<Link
							style={{
								color: '#2754C5',
								fontSize: '14px',
								textDecoration: 'underline',
							}}
							href={`mailto:info@opensenselab.org?Subject=Hilfe%20bei%20der%20Einrichtung&body=Bitte%20bei%20jeder%20Anfrage%20die%20ID%20(${device.id})%20mit%20angeben.%20Danke!`}
						>
							info@opensenselab.org
						</Link>
					</Text>
					<Text>{i.formatMessage({ id: 'closing' })}</Text>
				</Container>
			</Body>
		</Html>
	)
}

export default BaseNewDeviceEmail
