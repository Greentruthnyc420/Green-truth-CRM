import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RepDashboard from '../screens/rep/RepDashboard';
import RepActivations from '../screens/rep/RepActivations';
import RepOrders from '../screens/rep/RepOrders';
import RepProfile from '../screens/rep/RepProfile';
import BrandDashboard from '../screens/brand/BrandDashboard';
import BrandOrders from '../screens/brand/BrandOrders';
import BrandDeals from '../screens/brand/BrandDeals';
import BrandProfile from '../screens/brand/BrandProfile';
import DispensaryDashboard from '../screens/dispensary/DispensaryDashboard';
import DispensaryMarketplace from '../screens/dispensary/DispensaryMarketplace';
import DispensaryOrders from '../screens/dispensary/DispensaryOrders';
import DispensaryProfile from '../screens/dispensary/DispensaryProfile';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Rep Tab Navigator
function RepTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Activations') iconName = focused ? 'calendar' : 'calendar-outline';
                    else if (route.name === 'Orders') iconName = focused ? 'cart' : 'cart-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#10b981',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Dashboard" component={RepDashboard} />
            <Tab.Screen name="Activations" component={RepActivations} />
            <Tab.Screen name="Orders" component={RepOrders} />
            <Tab.Screen name="Profile" component={RepProfile} />
        </Tab.Navigator>
    );
}

// Brand Tab Navigator
function BrandTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Dashboard') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                    else if (route.name === 'Orders') iconName = focused ? 'receipt' : 'receipt-outline';
                    else if (route.name === 'Deals') iconName = focused ? 'pricetag' : 'pricetag-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'business' : 'business-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#8b5cf6',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Dashboard" component={BrandDashboard} />
            <Tab.Screen name="Orders" component={BrandOrders} />
            <Tab.Screen name="Deals" component={BrandDeals} />
            <Tab.Screen name="Profile" component={BrandProfile} />
        </Tab.Navigator>
    );
}

// Dispensary Tab Navigator
function DispensaryTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Dashboard') iconName = focused ? 'storefront' : 'storefront-outline';
                    else if (route.name === 'Marketplace') iconName = focused ? 'grid' : 'grid-outline';
                    else if (route.name === 'Orders') iconName = focused ? 'list' : 'list-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'settings' : 'settings-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#3b82f6',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Dashboard" component={DispensaryDashboard} />
            <Tab.Screen name="Marketplace" component={DispensaryMarketplace} />
            <Tab.Screen name="Orders" component={DispensaryOrders} />
            <Tab.Screen name="Profile" component={DispensaryProfile} />
        </Tab.Navigator>
    );
}

// Main App Navigator
export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="RepTabs" component={RepTabs} />
                <Stack.Screen name="BrandTabs" component={BrandTabs} />
                <Stack.Screen name="DispensaryTabs" component={DispensaryTabs} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
