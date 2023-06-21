export async function getPhenomena() {
  const response = await fetch(
    "https://api.sensors.wiki/phenomena/all?language=de"
  );
  const jsonData = await response.json();
  return jsonData;
}
