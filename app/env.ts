declare module 'react-router' {
	// Your AppLoadContext used in v2
	interface AppLoadContext {
		cspNonce: any
		serverBuild: any
	}
}

export {} // necessary for TS to treat this as a module
