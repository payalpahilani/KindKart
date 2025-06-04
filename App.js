// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import HomeScreen from "./Components/screens/HomeScreen";

function DummyScreen() {
  return null; // Placeholder for other tabs
}

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: "#F6B93B",
          tabBarInactiveTintColor: "#888",
          tabBarShowLabel: true,
          tabBarStyle: {
            height: 70,
            paddingBottom: 18,
            paddingTop: 8,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 16,
            backgroundColor: "#fff",
            elevation: 10, // Android shadow
            shadowColor: "#000", // iOS shadow
            shadowOpacity: 0.07,
            shadowRadius: 8,
          },
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === "Home") iconName = "home-variant";
            else if (route.name === "Charity") iconName = "hand-heart";
            else if (route.name === "Campaigns") iconName = "bullhorn";
            else if (route.name === "Profile") iconName = "account";
            return <Icon name={iconName} color={color} size={size} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Charity" component={DummyScreen} />
        <Tab.Screen name="Campaigns" component={DummyScreen} />
        <Tab.Screen name="Profile" component={DummyScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
