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
          tabBarShowLabel: false, // Hides the labels
          tabBarActiveTintColor: "#F6B93B",
          tabBarInactiveTintColor: "#888",
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
            elevation: 10,
            shadowColor: "#000",
            shadowOpacity: 0.07,
            shadowRadius: 8,
          },
          tabBarIcon: ({ color, size }) => {
            let iconName;
            switch (route.name) {
              case "Home":
                iconName = "home-outline";
                break;
              case "Marketplace":
                iconName = "tag-outline";
                break;
              case "Sell":
                iconName = "plus-circle-outline";
                break;
              case "Chat":
                iconName = "message-text-outline";
                break;
              case "Options":
                iconName = "menu";
                break;
              default:
                iconName = "circle";
            }
            return <Icon name={iconName} color={color} size={28} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Marketplace" component={DummyScreen} />
        <Tab.Screen name="Sell" component={DummyScreen} />
        <Tab.Screen name="Chat" component={DummyScreen} />
        <Tab.Screen name="Options" component={DummyScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
