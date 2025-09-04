export default ({ config }) => ({
  ...config,
  name: "MenstrualApp",
  slug: "menstrual-app",
  extra: {
    apiBaseUrl: process.env.API_BASE_URL || "http://192.168.0.173:8000", // <-- change me
  },
  // for EAS builds later; not needed for Expo Go
});
