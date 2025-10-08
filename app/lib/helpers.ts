export const hasObjPropMatchWithPrefixKey = (
    object: Object,
    prefixes: string[]
  ) => {
    const keys = Object.keys(object);
    for (const key of keys) {
      for (const prefix of prefixes) {
        if (key.startsWith(prefix)) {
          return true;
        }
      }
    }
    return false;
  };
  
  export const exposureHelper = (exposure: string) => {
    switch (exposure) {
      case "mobile":
        return "MOBILE";
      case "outdoor":
        return "OUTDOOR";
      case "indoor":
        return "INDOOR";
      default:
        return "UNKNOWN";
    }
  };
      