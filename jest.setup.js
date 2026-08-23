jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Silences React 19's "not configured to support act(...)" warnings — this
// is the documented flag for test environments using React's concurrent
// act() checks (jest-expo/RNTL don't set it automatically yet for RN 0.86).
global.IS_REACT_ACT_ENVIRONMENT = true;
