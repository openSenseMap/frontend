import { type Feature } from '~/lib/directus'

export default function FeatureCard(item: Feature) {
	return (
		<div
			key={item.id}
			className="flex flex-col items-center justify-center rounded-xl border-4 border-solid border-light-green bg-white p-4 text-center text-4xl text-gray-300 shadow-[5px_5px_rgba(0,98,90,0.4),8px_8px_rgba(0,98,90,0.3),11px_11px_rgba(0,98,90,0.2),14px_14px_rgba(0,98,90,0.1),17px_17px_rgba(0,98,90,0.05)] dark:bg-gray-900 dark:text-gray-100"
		>
			<div className="pb-4 font-serif text-2xl font-extrabold text-light-green subpixel-antialiased dark:text-green-200">
				{item.title}
			</div>
			<div className="text-center text-lg">{item.description}</div>
			<div className="pt-4">
				<img src={`${ENV.DIRECTUS_URL}/assets/${item.icon}`} alt="api_svg" />
			</div>
		</div>
	)
}
