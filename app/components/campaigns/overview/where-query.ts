export const generateWhereObject = (query: URLSearchParams) => {
  const where: {
    title?: {
      contains: string;
      mode: "insensitive";
    };
    priority?: string;
    country?: {
      contains: string;
      mode: "insensitive";
    };
    exposure?: string;
    startDate?: {
      gte: Date;
    };
    endDate?: {
      lte: Date;
    };
    phenomena?: any;
  } = {};

  if (query.get("search")) {
    where.title = {
      contains: query.get("search") || "",
      mode: "insensitive",
    };
  }

  if (query.get("priority")) {
    const priority = query.get("priority") || "";
    where.priority = priority;
  }

  if (query.get("country")) {
    where.country = {
      contains: query.get("country") || "",
      mode: "insensitive",
    };
  }

  if (query.get("exposure")) {
    const exposure = query.get("exposure") || "UNKNOWN";
    where.exposure = exposure;
  }
  if (query.get("phenomena")) {
    const phenomenaString = query.get("phenomena") || "";
    try {
      const phenomena = JSON.parse(phenomenaString);

      if (Array.isArray(phenomena) && phenomena.length > 0) {
        where.phenomena = {
          hasSome: phenomena,
        };
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  }

  if (query.get("startDate")) {
    const startDate = new Date(query.get("startDate") || "");
    where.startDate = {
      gte: startDate,
    };
  }

  if (query.get("endDate")) {
    const endDate = new Date(query.get("endDate") || "");
    where.endDate = {
      lte: endDate,
    };
  }

  return where;
};
