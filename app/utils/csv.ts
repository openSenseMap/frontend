/**
 * Converts data in any format to CSV
 * @param headers The headers of the resultant CSV. Order is important.
 * @param data The data as an array of arbitrary data rows
 * @param dataSelectors Selectors that picks data out of a data row and converts it into a string.
 * Order should be the same as for the headers.
 * @returns 
 */
export const convertToCsv = <DataRow>(headers: string[], data: DataRow[],
    dataSelectors: ((row: DataRow) => string)[], delimiter = ",") => {

    const rows: string[] = data.map(dataRow => 
        headers.map((_, i) => dataSelectors[i](dataRow)).join(delimiter)
    )

    return [headers.join(delimiter), ...rows].join("\n")
}