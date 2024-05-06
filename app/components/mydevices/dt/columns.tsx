/* eslint-disable react/jsx-no-undef */
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ClipboardCopy, Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Device } from "~/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export type SenseBox = {
  id: string;
  name: string;
  exposure: Device["exposure"];
  // model: string;
};

const colStyle = "pl-0 dark:text-white";

export const columns: ColumnDef<SenseBox>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className={colStyle}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "exposure",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className={colStyle}
        >
          Exposure
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
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
          Model
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  }, */
  {
    accessorKey: "id",
    header: () => <div className="dark:text-white pl-0">Sensebox ID</div>,
    cell: ({ row }) => {
      const senseBox = row.original;

      return (
        // <div className="text-right font-medium">
        <div className="flex items-center">
          <code className="rounded-sm bg-[#f9f2f4] px-1 py-[2px] text-[#c7254e]">
            {senseBox?.id}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(senseBox?.id);
              }}
            ></button>
          </code>
          <ClipboardCopy className="ml-[6px] mr-1 inline-block h-4 w-4 align-text-bottom text-[#818a91] dark:text-white cursor-pointer" />
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center dark:text-white">Actions</div>,
    cell: ({ row }) => {
      const senseBox = row.original;

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
              <a href={`/device/${senseBox.id}/edit`}>Edit</a>
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
      );
    },
  },
];
