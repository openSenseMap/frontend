import { stringify } from 'csv-stringify/sync'
import { type BoxesDataColumn } from '~/lib/api-schemas/boxes-data-query-schema'

type Delimiter = 'comma' | 'semicolon'

export function formatAsCSV(
	data: any[],
	columns: BoxesDataColumn[],
	delimiter: Delimiter,
) {
	const delimiterChar = delimiter === 'semicolon' ? ';' : ','
	const csv = stringify(data, {
		header: true,
		columns: columns,
		delimiter: delimiterChar,
		cast: {
			date: (d: Date) => d.toISOString(),
		},
	})

	return csv.trimEnd()
}
