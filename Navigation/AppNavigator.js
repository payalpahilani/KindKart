import React from 'react'
import {NavigationContainer} from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LaunchScreen from '../Components/screens/LaunchScreen'
import LoginScreen from '../Components/screens/LoginScreen'
import SignUpScreen from '../Components/screens/SignUpScreen'
// import HomeScreen from '../Components/screens/HomeScreen'

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}} initialRouteName='Launch'>
         <Stack.Screen name = "Launch" component = {LaunchScreen} />
         <Stack.Screen name = "Login" component = {LoginScreen} />
         <Stack.Screen name = "SignUp" component = {SignUpScreen} />
         {/* <Stack.Screen name = "Home" component = {HomeScreen} /> */}
        </Stack.Navigator>
    </NavigationContainer>
  )
}
