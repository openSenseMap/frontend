// import i18next from "app/i18next.server";

import i18next from "i18next";

export function sensorWikiLabel(label: any) {
  //   const locale = await i18next.getLocale(request);

  const lang = getLanguage();
  const labelFound = label.item.filter(
    (labelItem: any) => labelItem.languageCode == lang
  );

  if (labelFound.length > 0) {
    return labelFound[0].text;
  } else {
    return label.item[0].text;
  }
}

export function getLanguage() {
  return i18next.language || window.localStorage.i18nextLng;
}
