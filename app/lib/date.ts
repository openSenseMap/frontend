const ONE_MINUTE_IN_S = 60
const ONE_HOUR_IN_S = 60 * ONE_MINUTE_IN_S
const ONE_DAY_IN_S = 24 * ONE_HOUR_IN_S
const ONE_WEEK_IN_S = 7 * ONE_DAY_IN_S
const ONE_MONTH_IN_S = 4 * ONE_WEEK_IN_S
const ONE_QUARTER_IN_S = 3 * ONE_MONTH_IN_S
const ONE_YEAR_IN_S = 12 * ONE_MONTH_IN_S

export const dateDiffToNowInWords = (locale: string, date: Date) => {
	const r = new Intl.RelativeTimeFormat(locale)
	const now = new Date()
	const diffInSeconds = Math.round((now.getTime() - date.getTime()) / 1000)

	if (diffInSeconds < ONE_MINUTE_IN_S) return r.format(-diffInSeconds, 'second')
	if (diffInSeconds < ONE_HOUR_IN_S)
		return r.format(-Math.round(diffInSeconds / ONE_MINUTE_IN_S), 'minute')
	if (diffInSeconds < ONE_DAY_IN_S)
		return r.format(-Math.round(diffInSeconds / ONE_HOUR_IN_S), 'hour')
	if (diffInSeconds < ONE_WEEK_IN_S)
		return r.format(-Math.round(diffInSeconds / ONE_DAY_IN_S), 'day')
	if (diffInSeconds < ONE_MONTH_IN_S)
		return r.format(-Math.round(diffInSeconds / ONE_WEEK_IN_S), 'week')
	if (diffInSeconds < ONE_QUARTER_IN_S)
		return r.format(-Math.round(diffInSeconds / ONE_QUARTER_IN_S), 'quarter')
	if (diffInSeconds < ONE_YEAR_IN_S)
		return r.format(-Math.round(diffInSeconds / ONE_MONTH_IN_S), 'month')
}
