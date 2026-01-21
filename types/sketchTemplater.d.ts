declare module '@sensebox/sketch-templater' {
	const SketchTemplater: new (cfg: unknown) => {
		generateSketch: (
			box: unknown,
			options?: unknown,
		) => Response | Promise<Response>
	}
	export default SketchTemplater
}
