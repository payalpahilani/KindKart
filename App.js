// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import HomeScreen from "./Components/screens/HomeScreen";
import MarketplaceScreen from "./Components/screens/MarketPlaceScreen";

function DummyScreen() {
  return null;
}

const Tab = createBottomTabNavigator();

function MyTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
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

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabButton}
            activeOpacity={0.8}
          >
            <Icon
              name={iconName}
              color={isFocused ? "#F6B93B" : "#888"}
              size={26}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Home"
        tabBar={(props) => <MyTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
        <Tab.Screen name="Sell" component={DummyScreen} />
        <Tab.Screen name="Chat" component={DummyScreen} />
        <Tab.Screen name="Options" component={DummyScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "absolute",
    left: 30, // Adjust to control width
    right: 30, // Adjust to control width
    bottom: 20,
    height: 60,
    backgroundColor: "#fff",
    borderRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    paddingHorizontal: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
});
