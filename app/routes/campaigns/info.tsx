export default function Info() {
  return (
    <div className="h-full w-full">
      <h1 className="ml-10 text-lg font-bold">
        OpensenseMap Kampagnen Manager
      </h1>
      <div className="mt-4 ml-10 flex flex-col">
        <span>
          Der OpensenseMap Kampagnen Manager ist Ihr Werkzeug um Kampagnen für
          die OpensenseMap zu erstellen oder an diesen teilzunehmen.{" "}
        </span>
        <span>
          Citizen Scientists können sich hier zu einem gemeinsamen Ziel
          zusammenfinden, sowie sich untereinander austauschen und organisieren.
        </span>
        <span className="mt-5">
          Klicke{" "}
          <a className="underlined text-blue-500" href="./">
            hier
          </a>{" "}
          um aktuelle Kampagnen zu erkunden!
        </span>
      </div>
    </div>
  );
}
