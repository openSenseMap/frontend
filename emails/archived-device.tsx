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
	Hr,
	Section,
} from '@react-email/components'

export interface DeviceArchivedEmailProps {
	user: {
		name: string
	}
	device: {
		id: string
		name: string
		lastActivity?: string // ISO date string
	}
	language: 'de' | 'en'
	content: typeof messages
}

export const messages = {
	en: {
		preview: 'Your device has been archived due to inactivity',
		heading: 'Device Archived',
		subheading: 'Due to inactivity',
		greeting: 'Hello',
		mainText:
			'your device "{ deviceName }" has been archived after 12 months of inactivity. Archived devices are no longer publicly visible on openSenseMap, but all your data is safely preserved.',
		whatThisMeans: 'What does this mean?',
		point1: 'Your device is no longer publicly visible on the map.',
		point2: 'All historical sensor data remains stored and is not deleted.',
		point3: 'You can reactivate your device at any time from your dashboard.',
		deviceId: 'Device ID',
		lastSeen: 'Last activity',
		reactivateText: 'Want to continue contributing? Reactivate your device:',
		reactivateCta: 'Reactivate Device',
		support:
			'Questions? Reach us on GitHub or via email: ',
		closing: 'Thank you for your past contributions to openSenseMap.',
		teamSignoff: 'The openSenseMap Team',
	},
	de: {
		preview: 'Dein Gerät wurde wegen Inaktivität archiviert',
		heading: 'Gerät archiviert',
		subheading: 'Aufgrund von Inaktivität',
		greeting: 'Hallo',
		mainText:
			'dein Gerät "{ deviceName }" wurde nach 12 Monaten Inaktivität archiviert. Archivierte Geräte sind auf der openSenseMap nicht mehr öffentlich sichtbar, aber alle deine Daten sind sicher gespeichert.',
		whatThisMeans: 'Was bedeutet das?',
		point1: 'Dein Gerät ist auf der Karte nicht mehr öffentlich sichtbar.',
		point2: 'Alle historischen Sensordaten bleiben gespeichert und werden nicht gelöscht.',
		point3: 'Du kannst dein Gerät jederzeit über dein Dashboard reaktivieren.',
		deviceId: 'Geräte-ID',
		lastSeen: 'Letzte Aktivität',
		reactivateText: 'Möchtest du weiter mitmachen? Reaktiviere dein Gerät:',
		reactivateCta: 'Gerät reaktivieren',
		support:
			'Fragen? Kontaktiere uns über GitHub oder schreib eine Mail an: ',
		closing: 'Danke für deine bisherigen Beiträge zur openSenseMap.',
		teamSignoff: 'Dein openSenseMap Team',
	},
}

const baseUrl = process.env.OSEM_URL
	? `https://${process.env.OSEM_URL}`
	: 'https://opensensemap.org'

const styles = {
	body: {
		backgroundColor: '#f5f4f0',
		fontFamily:
			"'Georgia', 'Times New Roman', Times, serif",
		margin: '0',
		padding: '0',
	},
	outerContainer: {
		maxWidth: '560px',
		margin: '0 auto',
		padding: '40px 16px',
	},
	card: {
		backgroundColor: '#ffffff',
		borderRadius: '2px',
		overflow: 'hidden' as const,
		boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
	},
	statusBanner: {
		backgroundColor: '#c97d2e',
		padding: '6px 28px',
		display: 'block' as const,
	},
	statusBannerText: {
		color: '#fff8ee',
		fontSize: '11px',
		fontFamily: "'Courier New', Courier, monospace",
		letterSpacing: '2px',
		textTransform: 'uppercase' as const,
		margin: '0',
	},
	headerSection: {
		padding: '32px 28px 24px',
		borderBottom: '1px solid #ede9e0',
	},
	heading: {
		color: '#1a1a18',
		fontSize: '28px',
		fontWeight: 'bold',
		margin: '0 0 4px 0',
		padding: '0',
		lineHeight: '1.2',
		letterSpacing: '-0.5px',
	},
	subheading: {
		color: '#8a7f6e',
		fontSize: '13px',
		fontFamily: "'Courier New', Courier, monospace",
		letterSpacing: '1.5px',
		textTransform: 'uppercase' as const,
		margin: '0',
	},
	bodySection: {
		padding: '24px 28px',
	},
	text: {
		color: '#3d3930',
		fontSize: '15px',
		lineHeight: '1.7',
		margin: '0 0 16px 0',
	},
	infoBox: {
		backgroundColor: '#faf8f3',
		border: '1px solid #e8e2d4',
		borderLeft: '3px solid #c97d2e',
		borderRadius: '2px',
		padding: '16px 18px',
		margin: '20px 0',
	},
	infoBoxHeading: {
		color: '#1a1a18',
		fontSize: '12px',
		fontFamily: "'Courier New', Courier, monospace",
		letterSpacing: '1.5px',
		textTransform: 'uppercase' as const,
		margin: '0 0 12px 0',
		fontWeight: 'bold',
	},
	bulletPoint: {
		color: '#3d3930',
		fontSize: '14px',
		lineHeight: '1.6',
		margin: '0 0 6px 0',
		paddingLeft: '4px',
	},
	metaBox: {
		backgroundColor: '#f5f4f0',
		borderRadius: '2px',
		padding: '14px 18px',
		margin: '20px 0',
	},
	metaLabel: {
		color: '#8a7f6e',
		fontSize: '10px',
		fontFamily: "'Courier New', Courier, monospace",
		letterSpacing: '1.5px',
		textTransform: 'uppercase' as const,
		margin: '0 0 2px 0',
	},
	metaValue: {
		color: '#1a1a18',
		fontSize: '13px',
		fontFamily: "'Courier New', Courier, monospace",
		margin: '0 0 12px 0',
		fontWeight: 'bold',
	},
	ctaSection: {
		padding: '0 28px 24px',
		textAlign: 'center' as const,
	},
	ctaText: {
		color: '#8a7f6e',
		fontSize: '13px',
		margin: '0 0 14px 0',
	},
	ctaButton: {
		display: 'inline-block' as const,
		backgroundColor: '#c97d2e',
		color: '#ffffff',
		fontSize: '13px',
		fontFamily: "'Courier New', Courier, monospace",
		letterSpacing: '1.5px',
		textTransform: 'uppercase' as const,
		textDecoration: 'none',
		padding: '12px 28px',
		borderRadius: '2px',
	},
	hr: {
		borderColor: '#ede9e0',
		margin: '0',
	},
	footer: {
		padding: '20px 28px',
	},
	footerText: {
		color: '#8a7f6e',
		fontSize: '13px',
		lineHeight: '1.6',
		margin: '0 0 8px 0',
	},
	footerLink: {
		color: '#c97d2e',
		textDecoration: 'underline',
	},
	teamSignoff: {
		color: '#3d3930',
		fontSize: '13px',
		fontFamily: "'Courier New', Courier, monospace",
		margin: '16px 0 0 0',
	},
}

export const DeviceArchivedEmail = ({
	user = { name: 'Erika Mustermann' },
	device = { id: '12345678', name: 'My Weather Station', lastActivity: '2024-02-15T08:00:00Z' },
	language = 'en',
	content = messages,
}: DeviceArchivedEmailProps) => {
	const i = createIntl({
		locale: language,
		messages: content[language],
	})

	const formattedDate = device.lastActivity
		? new Date(device.lastActivity).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-GB', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
		  })
		: '—'

	return (
		<Html lang={language} dir="ltr">
			<Head />
			<Preview>{i.formatMessage({ id: 'preview' })}</Preview>
			<Body style={styles.body}>
				<Container style={styles.outerContainer}>
					<div style={styles.card}>
						{/* Status banner */}
						<Section style={styles.statusBanner}>
							<Text style={styles.statusBannerText}>
								openSenseMap · {i.formatMessage({ id: 'subheading' })}
							</Text>
						</Section>

						{/* Header */}
						<Section style={styles.headerSection}>
							<Heading style={styles.heading}>
								{i.formatMessage({ id: 'heading' })}
							</Heading>
						</Section>

						{/* Body */}
						<Section style={styles.bodySection}>
							<Text style={styles.text}>
								{i.formatMessage({ id: 'greeting' })} {user.name},
							</Text>
							<Text style={styles.text}>
								{i.formatMessage({ id: 'mainText' }, { deviceName: device.name })}
							</Text>

							{/* What this means */}
							<div style={styles.infoBox}>
								<Text style={styles.infoBoxHeading}>
									{i.formatMessage({ id: 'whatThisMeans' })}
								</Text>
								<Text style={styles.bulletPoint}>
									→ {i.formatMessage({ id: 'point1' })}
								</Text>
								<Text style={styles.bulletPoint}>
									→ {i.formatMessage({ id: 'point2' })}
								</Text>
								<Text style={{ ...styles.bulletPoint, marginBottom: '0' }}>
									→ {i.formatMessage({ id: 'point3' })}
								</Text>
							</div>

							{/* Device meta */}
							<div style={styles.metaBox}>
								<Text style={styles.metaLabel}>{i.formatMessage({ id: 'deviceId' })}</Text>
								<Text style={styles.metaValue}>{device.id}</Text>
								<Text style={{ ...styles.metaLabel }}>
									{i.formatMessage({ id: 'lastSeen' })}
								</Text>
								<Text style={{ ...styles.metaValue, marginBottom: '0' }}>
									{formattedDate}
								</Text>
							</div>
						</Section>

						{/* CTA */}
						<Section style={styles.ctaSection}>
							<Text style={styles.ctaText}>
								{i.formatMessage({ id: 'reactivateText' })}
							</Text>
							<Link
								href={`${baseUrl}/dashboard`}
								style={styles.ctaButton}
							>
								{i.formatMessage({ id: 'reactivateCta' })}
							</Link>
						</Section>

						<Hr style={styles.hr} />

						{/* Footer */}
						<Section style={styles.footer}>
							<Text style={styles.footerText}>
								{i.formatMessage({ id: 'support' })}
								<Link
									href={`mailto:info@opensenselab.org?Subject=Device%20Reactivation&body=Device%20ID:%20${device.id}`}
									style={styles.footerLink}
								>
									info@opensenselab.org
								</Link>
							</Text>
							<Text style={styles.footerText}>
								{i.formatMessage({ id: 'closing' })}
							</Text>
							<Text style={styles.teamSignoff}>
								— {i.formatMessage({ id: 'teamSignoff' })}
							</Text>
						</Section>
					</div>
				</Container>
			</Body>
		</Html>
	)
}

export default DeviceArchivedEmail