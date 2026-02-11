import LanguageSelector from '../landing/header/language-selector'
import Download from './download'
import Home from './home'
import Menu from './menu'
import NavBar from './nav-bar'
// import { useLoaderData } from "@remix-run/react";
// import Notification from "./notification";
// import type { loader } from "~/routes/explore.$deviceId._index";

interface HeaderProps {
	devices: any
}

export default function Header(props: HeaderProps) {
	// const data = useLoaderData<typeof loader>();
	return (
		<div className="items-top pointer-events-none fixed z-10 flex h-14 w-full justify-between gap-4 p-2">
			<Home />
			<NavBar devices={props.devices} />
			<div className="flex gap-2">
				<div className="pointer-events-auto flex h-10 w-16 items-center justify-center rounded-full bg-white shadow-md">
					<LanguageSelector />
				</div>
				<Download devices={props.devices} />
				{/* {data?.user?.email ? <Notification /> : null} */}
				<Menu />
			</div>
		</div>
	)
}
