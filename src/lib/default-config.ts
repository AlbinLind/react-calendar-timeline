export const defaultKeys = {
  groupIdKey: "id",
  groupTitleKey: "title",
  groupRightTitleKey: "rightTitle",
  groupLabelKey: "title",
  itemIdKey: "id",
  itemTitleKey: "title",
  itemDivTitleKey: "title",
  itemGroupKey: "group",
  itemTimeStartKey: "start_time",
  itemTimeEndKey: "end_time",
};

export const defaultTimeSteps = {
  second: 1,
  minute: 1,
  hour: 1,
  day: 1,
  week: 1,
  isoWeek: 1,
  month: 1,
  year: 1,
};

type UnitValue = {
  long: string;
  mediumLong: string;
  medium: string;
  short: string;
};
export const defaultHeaderFormats: Record<string, UnitValue> = {
  year: {
    long: "YYYY",
    mediumLong: "YYYY",
    medium: "YYYY",
    short: "YY",
  },
  month: {
    long: "MMMM YYYY",
    mediumLong: "MMMM",
    medium: "MMMM",
    short: "MM/YY",
  },
  week: {
    long: "[Week] w",
    mediumLong: "[Week] w",
    medium: "[Week] w",
    short: "w",
  },
  isoWeek: {
    long: "[Week] W",
    mediumLong: "[Week] W",
    medium: "[Week] W",
    short: "W",
  },
  day: {
    long: "dddd, LL",
    mediumLong: "dddd, LL",
    medium: "dd D",
    short: "D",
  },
  hour: {
    long: "dddd, LL, HH:00",
    mediumLong: "L, HH:00",
    medium: "HH:00",
    short: "HH",
  },
  minute: {
    long: "HH:mm",
    mediumLong: "HH:mm",
    medium: "HH:mm",
    short: "mm",
  },
  second: {
    long: "mm:ss",
    mediumLong: "mm:ss",
    medium: "mm:ss",
    short: "ss",
  },
};
