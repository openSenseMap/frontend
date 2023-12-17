import { MultiSelect } from "../ui/multi-select";
import { countryListAlpha2 } from "./overview/all-countries-object";
import type { DataItem } from "../ui/multi-select";

type Props = {
  selectedCountry?: DataItem;
  setSelected: React.Dispatch<React.SetStateAction<DataItem[]>>;
};
export default function SelectCountries({
  selectedCountry,
  setSelected,
}: Props) {
  const data = Object.entries(countryListAlpha2).map((entry) => {
    return {
      value: entry[0],
      label: entry[1],
    };
  });
  const preselected = selectedCountry;
  return (
    <MultiSelect
      placeholder="Select countries"
      data={data}
      preselected={preselected}
      setSelectedItems={setSelected}
    />
  );
}
