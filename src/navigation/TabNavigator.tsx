import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNavigationContainerRef } from "@react-navigation/native";
import { useTranslations } from "@/shared/i18n/useTranslations";
import { useTheme } from "@/shared/theme/useTheme";
import { MapScreen } from "../screens/map/MapScreen";
import { RouteScreen } from "../screens/route/RouteScreen";
import { FavoritesScreen } from "../screens/favorites/FavoritesScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { AnimatedTabIcon } from "./AnimatedTabIcon";

export type TabParamList = {
  Map: undefined;
  Route: undefined;
  Favorites: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const navigationRef = createNavigationContainerRef<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  Map: { focused: "map", unfocused: "map-outline" },
  Route: { focused: "navigate", unfocused: "navigate-outline" },
  Favorites: { focused: "bookmark", unfocused: "bookmark-outline" },
  Profile: { focused: "person", unfocused: "person-outline" }
};

export function TabNavigator() {
  const t = useTranslations();
  const { colors } = useTheme();
  const tabLabels: Record<keyof TabParamList, string> = {
    Map: t.auth.tabMap,
    Route: t.auth.tabRoute,
    Favorites: t.auth.tabSaved,
    Profile: t.auth.tabProfile
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.divider },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabel: tabLabels[route.name as keyof TabParamList],
        tabBarIcon: ({ color, size, focused }) => {
          const icons = TAB_ICONS[route.name as keyof TabParamList];
          return <AnimatedTabIcon focusedName={icons.focused} unfocusedName={icons.unfocused} color={color} size={size} focused={focused} />;
        }
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Route" component={RouteScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
