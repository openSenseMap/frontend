"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Exposure } from "@prisma/client";

export type SenseBox = {
  id: string;
  name: string;
  exposure: Exposure;
  // `model: string;
};

export const columns: ColumnDef<SenseBox>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="pl-0"
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
          className="pl-0"
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
          className="pl-0"
        >
          Model
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  }, */
  {
    accessorKey: "id",
    header: () => <div className="hidden">Sensebox ID</div>,
    cell: ({ row }) => {
      const senseBox = row.original;

      return (
        // <div className="text-right font-medium">
        <div className=" hidden">
          <code className="rounded-sm bg-[#f9f2f4] px-1 py-[2px] text-[#c7254e]">
            {senseBox?.id}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(senseBox?.id);
              }}
            >
              <ClipboardCopy className="ml-[6px] mr-1 inline-block h-4 w-4 align-text-bottom text-[#818a91]" />
            </button>
          </code>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center">Action</div>,
    cell: ({ row }) => {
      const senseBox = row.original;

      return (
        // <div className="text-right font-medium">
        <div className=" text-right grid space-y-1">
          <a
            href={`/device/${senseBox.id}/overview`}
            className="btn btn-default text-[#000] hover:border-[#adadad] hover:bg-[#e6e6e6] hover:text-[#333]"
          >
            Overview
          </a>
          <a
            href={`/explore/${senseBox.id}`}
            className="btn btn-default  text-[#000] hover:border-[#adadad] hover:bg-[#e6e6e6] hover:text-[#333]"
          >
            Show on map
          </a>
          <a
            href={`/device/${senseBox.id}/edit`}
            className="btn btn-default    text-[#000]  hover:border-[#adadad] hover:bg-[#e6e6e6] hover:text-[#333]"
          >
            Edit
          </a>
          <a
            href={`/device/${senseBox.id}/dataupload`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-default    text-[#000]  hover:border-[#adadad] hover:bg-[#e6e6e6] hover:text-[#333]"
          >
            Data upload
          </a>
          <a
            href="https://sensebox.de/de/go-home"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-default   text-[#000]  hover:border-[#adadad] hover:bg-[#e6e6e6] hover:text-[#333]"
          >
            support
          </a>
        </div>
      );
    },
  },
];
