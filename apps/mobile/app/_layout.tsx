import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { registerForPushNotificationsAsync } from "../lib/push";
import { theme } from "../lib/theme";
import { ScreenCaptureGuard } from "../components/screen-capture-guard";

function PushRegistrar() {
  const { isSignedIn } = useAuth();
  useEffect(() => {
    if (isSignedIn) registerForPushNotificationsAsync().catch(() => { /* silent */ });
  }, [isSignedIn]);
  return null;
}

const tokenCache = {
  async getToken(key: string) { try { return await SecureStore.getItemAsync(key); } catch { return null; } },
  async saveToken(key: string, value: string) { try { await SecureStore.setItemAsync(key, value); } catch { /* noop */ } },
};

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <ScreenCaptureGuard />
        <PushRegistrar />
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.bg },
            headerTintColor: theme.text1,
            headerTitleStyle: { fontWeight: "700" },
            contentStyle: { backgroundColor: theme.bg },
          }}
        >
          <Stack.Screen name="index" options={{ title: "EYF" }} />
          <Stack.Screen name="daily" options={{ title: "Daily Challenge" }} />
          <Stack.Screen name="flashcards" options={{ title: "Flashcards" }} />
          <Stack.Screen name="streak" options={{ title: "Streak" }} />
        </Stack>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
