// import i18next from "app/i18next.server";

import i18next from "i18next";

export type SensorWikiTranslation = {
  item: SensorWikiLabel[];
};

export type SensorWikiLabel = {
  languageCode: string;
  text: string;
};

export function sensorWikiLabel(label: SensorWikiLabel[]) {
  //   const locale = await i18next.getLocale(request);
  if (!label) {
    return undefined;
  }
  const lang = getLanguage();
  const labelFound = label.filter(
    (labelItem: any) => labelItem.languageCode == lang
  );

  if (labelFound.length > 0) {
    return labelFound[0].text;
  } else {
    return label[0].text;
  }
}

export function getLanguage() {
  return i18next.language;
}
