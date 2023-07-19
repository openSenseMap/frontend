import Flags from "country-flag-icons/react/3x2";

type Props = {
  country: string;
};

export const CountryFlagIcon = ({ country }: Props) => {
  const Flag = Flags[country as keyof typeof Flags];

  return <Flag className="flex h-8 w-8 items-center justify-center" />;
};
