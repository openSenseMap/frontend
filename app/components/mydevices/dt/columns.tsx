"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Exposure } from "@prisma/client";

export type SenseBox = {
  id: string;
  name: string;
  exposure: Exposure;
  // model: string;
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
    header: "Sensebox ID",
    cell: ({ row }) => {
      const senseBox = row.original;

      return (
        // <div className="text-right font-medium">
        <div className="">
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
        <div className=" text-right">
          <a
            href={`/explore/${senseBox.id}`}
            className="btn btn-default rounded-br-none rounded-tr-none border-r-0 text-[#000] hover:border-[#adadad] hover:bg-[#e6e6e6] hover:text-[#333]"
          >
            Show
          </a>
          <a
            href={`mydevices/${senseBox.id}/edit`}
            className="btn btn-default rounded-bl-none rounded-br-none rounded-tl-none rounded-tr-none border-r-0 text-[#000]  hover:border-[#adadad] hover:bg-[#e6e6e6] hover:text-[#333]"
          >
            Edit
          </a>
          <a
            href={`mydevices/${senseBox.id}/dataupload`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-default rounded-bl-none rounded-br-none rounded-tl-none rounded-tr-none border-r-0 text-[#000]  hover:border-[#adadad] hover:bg-[#e6e6e6] hover:text-[#333]"
          >
            Data upload
          </a>
          <a
            href="https://sensebox.de/de/go-home"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-default rounded-bl-none rounded-tl-none text-[#000]  hover:border-[#adadad] hover:bg-[#e6e6e6] hover:text-[#333]"
          >
            support
          </a>
        </div>
      );
    },
  },
];
