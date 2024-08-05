import {
  endOfMonth,
  endOfWeek,
  endOfYesterday,
  startOfMonth,
  startOfToday,
  startOfWeek,
  startOfYesterday,
  sub,
} from "date-fns";

type DateTimeRange = {
  value: string;
  label: string;
  convert: () => { from: Date; to: Date };
};

const dateTimeRanges: DateTimeRange[] = [
  {
    value: "Last 30 minutes",
    label: "Last 30 minutes",
    convert: () => ({
      from: sub(new Date(), { minutes: 30 }),
      to: new Date(),
    }),
  },
  {
    value: "Last 1 hour",
    label: "Last 1 hour",
    convert: () => ({
      from: sub(new Date(), { hours: 1 }),
      to: new Date(),
    }),
  },
  {
    value: "Last 6 hours",
    label: "Last 6 hours",
    convert: () => ({
      from: sub(new Date(), { hours: 6 }),
      to: new Date(),
    }),
  },
  {
    value: "Last 12 hours",
    label: "Last 12 hours",
    convert: () => ({
      from: sub(new Date(), { hours: 12 }),
      to: new Date(),
    }),
  },
  {
    value: "Last 24 hours",
    label: "Last 24 hours",
    convert: () => ({
      from: sub(new Date(), { hours: 24 }),
      to: new Date(),
    }),
  },
  {
    value: "Last 7 days",
    label: "Last 7 days",
    convert: () => ({
      from: sub(new Date(), { days: 7 }),
      to: new Date(),
    }),
  },
  {
    value: "Last 30 days",
    label: "Last 30 days",
    convert: () => ({
      from: sub(new Date(), { days: 30 }),
      to: new Date(),
    }),
  },
  {
    value: "Yesterday",
    label: "Yesterday",
    convert: () => ({
      from: startOfYesterday(),
      to: endOfYesterday(),
    }),
  },
  {
    value: "Previous week",
    label: "Previous week",
    convert: () => ({
      from: startOfWeek(sub(new Date(), { weeks: 1 })),
      to: endOfWeek(sub(new Date(), { weeks: 1 })),
    }),
  },
  {
    value: "Previous month",
    label: "Previous month",
    convert: () => ({
      from: startOfMonth(sub(new Date(), { months: 1 })),
      to: endOfMonth(sub(new Date(), { months: 1 })),
    }),
  },
  {
    value: "Today so far",
    label: "Today so far",
    convert: () => ({
      from: startOfToday(),
      to: new Date(),
    }),
  },
  {
    value: "This week so far",
    label: "This week so far",
    convert: () => ({
      from: startOfWeek(new Date()),
      to: new Date(),
    }),
  },
  {
    value: "This month so far",
    label: "This month so far",
    convert: () => ({
      from: startOfMonth(new Date()),
      to: new Date(),
    }),
  },
];

export default dateTimeRanges;
