
import React from "react";
import AppNavigator from "./Navigation/AppNavigator";
import { ThemeProvider } from "./Components/Utilities/ThemeContext";
import './i18n';

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
  
}
