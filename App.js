import React from "react";
import AppNavigator from "./Navigation/AppNavigator";
import { ThemeProvider } from "./Components/Utilitis/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}
