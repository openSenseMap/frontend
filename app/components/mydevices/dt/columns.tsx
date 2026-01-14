'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, ClipboardCopy, Ellipsis } from 'lucide-react'
import { type UseTranslationResponse } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { type Device } from '~/schema'

export type SenseBox = {
	id: string
	name: string
	exposure: Device['exposure']
	// model: string;
}

const colStyle = 'pl-0 dark:text-white'

export function getColumns(
	useTranslation: UseTranslationResponse<'data-table', any>,
): ColumnDef<SenseBox>[] {
	const { t } = useTranslation
	return [
		{
			accessorKey: 'name',
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
						className={colStyle}
					>
						{t('name')}
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				)
			},
		},
		{
			accessorKey: 'exposure',
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
						className={colStyle}
					>
						{t('exposure')}
						<ArrowUpDown className="ml-2 h-4 w-4" />
					</Button>
				)
			},
		},
		/* {
    accessorKey: "model",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className={styleVal}
        >
          {t("model")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  }, */
		{
			accessorKey: 'id',
			header: () => (
				<div className="pl-0 dark:text-white">{t('sensebox_id')}</div>
			),
			cell: ({ row }) => {
				const senseBox = row.original

				return (
					// <div className="text-right font-medium">
					<div className="flex items-center">
						<code className="rounded-sm bg-[#f9f2f4] px-1 py-[2px] text-[#c7254e]">
							{senseBox?.id}
						</code>
						<ClipboardCopy
							onClick={() => navigator.clipboard.writeText(senseBox?.id)}
							className="ml-[6px] mr-1 inline-block h-4 w-4 cursor-pointer align-text-bottom text-[#818a91] dark:text-white"
						/>
					</div>
				)
			},
		},
		{
			id: 'actions',
			header: () => (
				<div className="text-center dark:text-white">{t('actions')}</div>
			),
			cell: ({ row }) => {
				const senseBox = row.original

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Open menu</span>
								<Ellipsis className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="dark:bg-dark-background dark:text-dark-text"
						>
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem>
								<a href={`/device/${senseBox.id}/overview`}>Overview</a>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<a href={`/explore/${senseBox.id}`}>Show on map</a>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<a href={`/device/${senseBox.id}/edit/general`}>Edit</a>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<a href={`/device/${senseBox.id}/dataupload`}>Data upload</a>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<a
									href="https://sensebox.de/de/go-home"
									target="_blank"
									rel="noopener noreferrer"
								>
									Support
								</a>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => navigator.clipboard.writeText(senseBox?.id)}
								className="cursor-pointer"
							>
								Copy ID
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)
			},
		},
	]
}
