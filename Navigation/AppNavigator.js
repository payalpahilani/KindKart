import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { ThemeContext } from "../Components/Utilities/ThemeContext";
// Import screens
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
import NgoHomeScreen from '../Components/screens/NgoHomeScreen';
import CampaignsScreen from '../Components/screens/CampaignsScreen';
import DonorsScreen from '../Components/screens/DonorsScreen';
import DonationDetailScreen from "../Components/screens/DonationDetailScreen";
import NgoProfileScreen from '../Components/screens/NgoProfileScreen';
import NgoLoginScreen from '../Components/screens/NgoLoginScreen';
import NgoSignUpScreen from '../Components/screens/NgoSignUpScreen';
import NgoCreateCampaignScreen from "../Components/screens/NgoCreateCampaign";
import NgoEditCampaign from "../Components/screens/NgoEditCampaign";
import AdDetailsScreen from "../Components/screens/AdDetailScreen";
import LikedAdsScreen from "../Components/screens/LikedAdsScreen";
import NgoEditProfileScreen from "../Components/screens/NgoEditProfileScreen";
import NgoDonationInfoScreen from "../Components/screens/NgoDonationInfoScreen";
import NgoDashboardScreen from '../Components/screens/NgoDashboardScreen';
import ForgotPasswordScreen from "../Components/screens/ForgotPasswordScreen";
import YourAdsScreen from "../Components/screens/YourAdsScreen";
import EditListingScreen from "../Components/screens/EditListingScreen";
import CategoryAdsScreen from "../Components/screens/CategoryAdsScreen";
import PaymentScreen from '../Components/screens/PaymentScreen';
import FAQScreen from "../Components/screens/FAQScreen";
import SellerDetailScreen from '../Components/screens/SellerDetailScreen'
import SellerReviewScreen from "../Components/screens/SellerReviewScreen";
import AllReviewsScreen from "../Components/screens/AllReviewsScreen"

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const NgoTab = createBottomTabNavigator();

// Custom Tab Bar
function MyTabBar({ state, navigation, descriptors, style }) {
  const { isDarkMode } = useContext(ThemeContext);

  if (style && style.display === "none") {
    return null;
  }

  return (
    <View style={[styles.tabBarContainer, isDarkMode && darkStyles.tabBarContainer, style]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const icons = {
          Home: "home-outline",
          Marketplace: "tag-outline",
          Sell: "plus-circle-outline",
          ChatList: "message-text-outline",
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
            <Icon
              name={iconName}
              size={26}
              color={isFocused ? "#F6B93B" : isDarkMode ? "#bbb" : "#888"}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}



// Main Tabs (NO ChatScreen here!)
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
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
      }}
      tabBar={(props) => <MyTabBar {...props} style={props.style} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
      <Tab.Screen name="Sell" component={ListItemScreen} />
      <Tab.Screen name="ChatList" component={ChatListScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// NGO Tabs (unchanged)
function NgoTabNavigator() {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <NgoTab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: "#EFAC3A",
        tabBarInactiveTintColor: isDarkMode ? "#aaa" : "gray",
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: {
          backgroundColor: isDarkMode ? "#222" : "#fff",
          paddingBottom: 10,
          height: 80,
          borderTopWidth: 0,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 4,
          elevation: 10,
        },
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "HomeNgo") {
            iconName = (
              <Ionicons name="home-outline" size={size} color={color} />
            );
          } else if (route.name === "Campaigns") {
            iconName = (
              <MaterialCommunityIcons
                name="bullhorn-outline"
                size={size}
                color={color}
              />
            );
          } else if (route.name === "Donors") {
            iconName = (
              <FontAwesome5
                name="hand-holding-heart"
                size={size}
                color={color}
              />
            );
          } else if (route.name === "Dashboard") {
            iconName = (
              <Ionicons name="analytics-outline" size={size} color={color} />
            );
          } else if (route.name === "Profile") {
            iconName = (
              <Ionicons name="person-outline" size={size} color={color} />
            );
          }
          return iconName;
        },
      })}
    >
      <NgoTab.Screen name="HomeNgo" component={NgoHomeScreen} />
      <NgoTab.Screen name="Campaigns" component={CampaignsScreen} />
      <NgoTab.Screen name="Donors" component={DonorsScreen} />
      <NgoTab.Screen name="Dashboard" component={NgoDashboardScreen} />
      <NgoTab.Screen name="Profile" component={NgoProfileScreen} />
    </NgoTab.Navigator>
  );
}


export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{ headerShown: false, gestureEnabled: false }}
        initialRouteName="Launch"
      >
        <RootStack.Screen name="Launch" component={LaunchScreen} />
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen}/>
        <RootStack.Screen name="SignUp" component={SignUpScreen} />
        <RootStack.Screen name="FAQ" component={FAQScreen} />
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen name="NgoLogin" component={NgoLoginScreen} />
        <RootStack.Screen name="NgoSignUp" component={NgoSignUpScreen} />
        <RootStack.Screen name="NgoHome" component={NgoTabNavigator} />
        <RootStack.Screen
          name="EditProfileScreen"
          component={EditProfileScreen}
        />
        <RootStack.Screen
          name="DonationDetail"
          component={DonationDetailScreen}
        />
        <RootStack.Screen name="SettingsScreen" component={SettingsScreen} />
        <RootStack.Screen name="AboutUsScreen" component={AboutUsScreen} />
        <RootStack.Screen
          name="TermsAndConditions"
          component={TermsAndConditionsScreen}
        />
        <RootStack.Screen name="ChatScreen" component={ChatScreen} />
        <RootStack.Screen
          name="NgoCreateCampaign"
          component={NgoCreateCampaignScreen}
        />
        <RootStack.Screen name="NgoEditCampaign" component={NgoEditCampaign} />
        <RootStack.Screen name="AdDetails" component={AdDetailsScreen} />
        <RootStack.Screen name="YourAdsScreen" component={YourAdsScreen} /> 
        <RootStack.Screen name="LikedAdsScreen" component={LikedAdsScreen} />
        <RootStack.Screen name="EditListingScreen" component={EditListingScreen} />
        <RootStack.Screen name="CategoryAdsScreen" component={CategoryAdsScreen} />
        <RootStack.Screen name="SellerDetailScreen" component={SellerDetailScreen} />
        <RootStack.Screen name="SellerReviewScreen" component={SellerReviewScreen} />
        <RootStack.Screen name="AllReviewsScreen" component={AllReviewsScreen} />
        <RootStack.Screen
          name="NgoEditProfile"
          component={NgoEditProfileScreen}
        />
        <RootStack.Screen
          name="NgoDonationInfoScreen"
          component={NgoDonationInfoScreen}
        />
        <RootStack.Screen
          name="PaymentScreen"
          component={PaymentScreen}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const darkStyles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: "#222",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderRadius: 24,
  },
});


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
