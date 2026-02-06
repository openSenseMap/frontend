import { type FieldTemplateProps } from '@rjsf/utils'

export function FieldTemplate(props: FieldTemplateProps) {
	const { id, label, required, description, errors, children } = props

	return (
		<div className="mb-4">
			{label && (
				<label
					htmlFor={id}
					className="mb-1 block text-sm font-semibold text-gray-800"
				>
					{label}
					{required && <span className="ml-1 text-red-500">*</span>}
				</label>
			)}

			{description}

			{children}

			{errors && <div className="text-red-600 mt-1 text-sm">{errors}</div>}
		</div>
	)
}
