import type { Dispatch, SetStateAction } from "react";
import { MultiSelect } from "../ui/multi-select";

type PhenomenaSelectProps = {
  phenomena: string[];
  localFilterObject: {
    country: string;
    exposure: string;
    phenomena: string[];
    time_range: {
      startDate: string;
      endDate: string;
    };
  };
  setLocalFilterObject: Dispatch<
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
};

export default function PhenomenaSelect({
  phenomena,
  setLocalFilterObject,
  localFilterObject,
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
      setLocalFilterObject={setLocalFilterObject}
      localFilterObject={localFilterObject}
    />
  );
}
