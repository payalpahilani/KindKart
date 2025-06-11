import React from "react";
import { NavigationContainer, getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import LaunchScreen from "../Components/screens/LaunchScreen";
import LoginScreen from "../Components/screens/LoginScreen";
import SignUpScreen from "../Components/screens/SignUpScreen";
import HomeScreen from "../Components/screens/HomeScreen";
import MarketplaceScreen from "../Components/screens/MarketPlaceScreen";
import ListItemScreen from "../Components/screens/ListItemScreen";
import ChatScreen from "../Components/screens/ChatScreen";
import ChatListScreen from "../Components/screens/ChatListScreen";
import ProfileScreen from "../Components/screens/ProfileScreen";
import EditProfileScreen from "../Components/screens/EditProfileScreen";
import SettingsScreen from "../Components/screens/SettingsScreen";
import AboutUsScreen from "../Components/screens/AboutUsScreen";
import TermsAndConditionsScreen from "../Components/screens/TermsAndConditionsScreen";

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ChatStack = createNativeStackNavigator();

function MyTabBar({ state, navigation }) {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const icons = {
          Home: "home-outline",
          Marketplace: "tag-outline",
          Sell: "plus-circle-outline",
          ChatTab: "message-text-outline",
          ProfileTab: "account-outline",
        };
        const iconName = icons[route.name] || "circle";

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={styles.tabButton}
            activeOpacity={0.8}
          >
            <Icon name={iconName} size={26} color={isFocused ? "#F6B93B" : "#888"} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ChatStackScreen() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatList" component={ChatListScreen} />
      <ChatStack.Screen name="ChatScreen" component={ChatScreen} />
    </ChatStack.Navigator>
  );
}

function getTabBarVisibility(route) {
  const routeName = getFocusedRouteNameFromRoute(route);
  if (routeName === "ChatScreen") {
    return false;
  }
  return true;
}

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: getTabBarVisibility(route)
          ? {
              position: "absolute",
              left: 30,
              right: 30,
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
            }
          : { display: "none" },
      })}
      tabBar={(props) => <MyTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
      <Tab.Screen name="Sell" component={ListItemScreen} />
      <Tab.Screen
        name="ChatTab"
        component={ChatStackScreen}
        options={({ route }) => ({
          tabBarStyle: getTabBarVisibility(route)
            ? {
                position: "absolute",
                left: 30,
                right: 30,
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
              }
            : { display: "none" },
        })}
      />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Launch">
        <RootStack.Screen name="Launch" component={LaunchScreen} />
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="SignUp" component={SignUpScreen} />
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen name="EditProfileScreen" component={EditProfileScreen} />
        <RootStack.Screen name="SettingsScreen" component={SettingsScreen} />
        <RootStack.Screen name="AboutUsScreen" component={AboutUsScreen} />
        <RootStack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "absolute",
    left: 30,
    right: 30,
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
