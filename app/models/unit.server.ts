export async function getPhenomena() {
  const response = await fetch("https://api.sensors.wiki/units/all");
  const jsonData = await response.json();
  return jsonData;
}

export type Unit = {
  id: number;
  slug: string;
  name: string;
  notation: string;
};
