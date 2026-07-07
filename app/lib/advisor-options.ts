export const ADVISOR_EXPERTISE_OPTIONS = [
  "Love & Relationship",
  "Dream Interpretation",
  "Career",
  "Deliverance",
  "Family",
  "Marriage",
  "Finances",
].map((value) => ({ value, label: value }));

export const ADVISOR_STYLE_OPTIONS = [
  "Compassionate",
  "Direct",
  "Expressive",
  "Thoughtful",
  "Inspirational",
  "Straightforward",
  "Connection",
].map((value) => ({ value, label: value }));

export const TIER_OPTIONS = [
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "platinum", label: "Platinum" },
];

const FALLBACK_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dhaka",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export const getTimezoneOptions = () => {
  const zones =
    typeof Intl !== "undefined" && "supportedValuesOf" in Intl
      ? Intl.supportedValuesOf("timeZone")
      : FALLBACK_TIMEZONES;
  return zones.map((value) => ({ value, label: value.replace(/_/g, " ") }));
};

