import type { Dispatch, SetStateAction } from "react";
import type { DataItem } from "../ui/multi-select";
import { MultiSelect } from "../ui/multi-select";

type PhenomenaSelectProps = {
  phenomena: string[];
  setSelected: React.Dispatch<React.SetStateAction<DataItem[]>>;
  localFilterObject?: {
    country: string;
    exposure: string;
    phenomena: string[];
    time_range: {
      startDate: string;
      endDate: string;
    };
  };
  setLocalFilterObject?: Dispatch<
    SetStateAction<{
      country: string;
      exposure: string;
      phenomena: string[];
      time_range: {
        startDate: string;
        endDate: string;
      };
    }>
  >;
  setSelectedPhenomena?: any;
};

export default function PhenomenaSelect({
  phenomena,
  setSelected,
}: PhenomenaSelectProps) {
  const data = phenomena.map((str) => {
    return {
      value: str,
      label: str,
    };
  });
  return (
    <MultiSelect
      //   label="Select phenomena"
      placeholder="Select phenomena"
      data={data}
      setSelectedItems={setSelected}
    />
  );
}
