import React from "react";
import AppNavigator from "./Navigation/AppNavigator";
import { ThemeProvider } from "./Components/Utilities/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
