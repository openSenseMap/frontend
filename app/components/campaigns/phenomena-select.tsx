import { MultiSelect } from "../ui/multi-select";

type PhenomenaSelectProps = {
  phenomena: string[];
};

export default function PhenomenaSelect({ phenomena }: PhenomenaSelectProps) {
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
    />
  );
}
