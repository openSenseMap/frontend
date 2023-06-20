export async function getPhenomena() {
  const response = await fetch("https://api.sensors.wiki/phenomena/all");
  console.log(response);
  const jsonData = await response.json();
  return jsonData;
}
