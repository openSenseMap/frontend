function jsonObj(sensors: { id: string }[]) {
    const obj: Record<string, number> = {};
    sensors.forEach((sensor, index) => {
      obj[sensor.id] = index;
    });
    return obj;
  }
  
  function jsonArr(sensors: { id: string }[]) {
    return sensors.map((sensor, index) => ({
      sensor: sensor.id,
      value: index,
    }));
  }
  
  export const jsonSubmitData = {
    jsonObj,
    jsonArr,
  };
  