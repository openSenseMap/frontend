import { Link } from 'react-router'

export default function Home() {
	return (
		<div>
			<div className="pointer-events-auto h-10 w-10">
				<Link to="/">
					<button
						type="button"
						className="h-10 w-10 rounded-full border border-gray-100 bg-white text-black shadow-xl hover:bg-gray-100"
					>
						<img
							src="/logo.png"
							alt="openSenseMapLogo"
							className="mx-auto h-7 w-7"
						/>
					</button>
				</Link>
			</div>
		</div>
	)
}
