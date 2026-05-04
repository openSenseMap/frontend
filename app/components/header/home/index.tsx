import { Link } from 'react-router'
const HOME_HASH = '#2.08/42.99/31.31'

export default function Home() {
	return (
		<div>
			<div className="pointer-events-auto h-10 w-40">
				<Link to={{
						pathname: '/explore',
						hash: HOME_HASH,
					}}>
					<button
						type="button"
						className="rounded-full border border-gray-100 bg-white/90 text-black shadow-xl hover:bg-gray-100"
					>
						<img
							src="/img/openSenseMap.png"
							alt="openSenseMapLogo"
							className="mx-auto"
						/>
					</button>
				</Link>
			</div>
		</div>
	)
}
