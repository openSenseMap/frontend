import React from 'react';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';


export default function NavBar() {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div className="w-1/2 h-10 mx-auto pointer-events-auto" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <NavigationMenu.Root className="relative">
        <NavigationMenu.List className="w-full h-10">
          <NavigationMenu.Item className="w-full h-10">
            <NavigationMenu.Trigger className="w-full h-10 bg-white data-[state=open]:rounded-t-[1.25rem] data-[state=closed]:rounded-[1.25rem]">
              {!isHovered ?
                <div className="flex items-center justify-around w-full h-10">
                  <div className="flex items-center justify-center rounded-full bg-orange-500 w-3/12 h-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                    <div className="text-center text-white">
                      Temperatur
                    </div>
                  </div>
                  <div className="flex items-center justify-center rounded-full bg-blue-700 w-4/12 h-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                    </svg>
                    <div className="text-center text-white">
                      01.01.2022 - 05.01-2022
                    </div>
                  </div>
                </div> 
                : 
                <div className="flex items-center justify-around w-full h-10 p-2">
                  <input type="text" placeholder="Suche, Filter & Einstellungen" className="w-full h-6 rounded-full" />
                </div>
              }
            </NavigationMenu.Trigger>
            <NavigationMenu.Content className="flex items-center justify-around container mx-auto bg-white rounded-b-[1.25rem]">
              <div>
                <p>Phänomene</p>
                <p>10.10.2022</p>
                <p>Karteneinstellungen</p>
              </div>
              <div>
                <input type="text" placeholder="Phänomene suchen" className="rounded-full" />
              </div>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu.Root>
    </div>
  );
}