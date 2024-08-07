import DonationiFrame from "./donate-iframe";
import DonationText from "./donate-text";

export default function Donate() {
  return (
    <div
      id="donate"
      className="flex h-full min-h-full items-center justify-center"
    >
      <div className="flex w-full flex-col">
        <div className="flex items-center justify-center pb-10">
        <p className="dark:text-green-200 font-serif text-6xl font-black text-light-green subpixel-antialiased">
            Donate
          </p>
        </div>
        <div className="grid grid-cols-2">
          <DonationText />
          <DonationiFrame />
        </div>
      </div>
    </div>
  );
}
