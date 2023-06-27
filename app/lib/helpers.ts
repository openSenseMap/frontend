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