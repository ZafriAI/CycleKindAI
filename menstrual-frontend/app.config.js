export default ({ config }) => ({
  ...config,
  name: "MenstrualApp",
  slug: "menstrual-app",
  extra: {
    apiBaseUrl: process.env.API_BASE_URL || "http://localhost:8000", // <-- change me
  },
  // for EAS builds later; not needed for Expo Go
});
