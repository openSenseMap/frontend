const partners = [
  {
    name: "Partner 1",
    logo: "/landing/logo_ifgi_long.png",
  },
  {
    name: "Partner 2",
    logo: "/landing/logo_ifgi_long.png",
  },
  {
    name: "Partner 3",
    logo: "/landing/logo_ifgi_long.png",
  },
  {
    name: "Partner 4",
    logo: "/landing/logo_ifgi_long.png",
  },
  {
    name: "Partner 5",
    logo: "/landing/logo_ifgi_long.png",
  },
  {
    name: "Partner 6",
    logo: "/landing/sensebox_wort_logo.png",
  },
  {
    name: "Partner 7",
    logo: "/landing/sensebox_wort_logo.png",
  },
  {
    name: "Partner 8",
    logo: "/landing/sensebox_wort_logo.png",
  },
  {
    name: "Partner 9",
    logo: "/landing/sensebox_wort_logo.png",
  },
  {
    name: "Partner 10",
    logo: "/landing/sensebox_wort_logo.png",
  },
  {
    name: "Partner 11",
    logo: "/landing/logo_ifgi_long.png",
  },
  {
    name: "Partner 12",
    logo: "/landing/logo_ifgi_long.png",
  },
  {
    name: "Partner 13",
    logo: "/landing/logo_ifgi_long.png",
  },
  {
    name: "Partner 14",
    logo: "/landing/logo_ifgi_long.png",
  },
  {
    name: "Partner 15",
    logo: "/landing/logo_ifgi_long.png",
  },
];

export default function Partners() {
  return (
    <div className="flex h-full min-h-full items-center justify-center">
      <div className="flex w-5/6 flex-col">
        <div className="flex items-center justify-center pb-10">
          <p className="font-serif text-6xl font-black text-blue-100 dark:text-blue-200 subpixel-antialiased">
            Partners
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center">
          {partners.map((partner, index) => {
            return (
              <div key={index} className="w-1/5 p-8">
                <img src={partner.logo} alt={partner.name}></img>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
