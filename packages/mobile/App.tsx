import { useCallback, useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoadingScreen from "@/screens/LoadingScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import WebViewScreen from "@/screens/WebViewScreen";
import { LOGIN_URL, DASHBOARD_URL, STORAGE_KEYS } from "@/constants";

// Keep the native (orange + white logo) splash up until the JS is ready, so
// the handoff to our branded loading screen is seamless.
SplashScreen.preventAutoHideAsync().catch(() => {});

type Phase = "loading" | "onboarding" | "app";

export default function App() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [startUrl, setStartUrl] = useState<string>(LOGIN_URL);

  // Hand off from the native splash to our loading screen (both orange).
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const handleLoadingDone = useCallback(async () => {
    let loggedIn = false;
    try {
      loggedIn = (await AsyncStorage.getItem(STORAGE_KEYS.loggedIn)) === "1";
    } catch {
      loggedIn = false;
    }
    if (loggedIn) {
      // Already logged in: skip onboarding and open the dashboard (which
      // redirects to login if the session has actually expired).
      setStartUrl(DASHBOARD_URL);
      setPhase("app");
    } else {
      // Not logged in: always show "Get Started".
      setPhase("onboarding");
    }
  }, []);

  const finishOnboarding = useCallback(() => {
    setStartUrl(LOGIN_URL);
    setPhase("app");
  }, []);

  return (
    <SafeAreaProvider>
      {phase === "loading" && <LoadingScreen onDone={handleLoadingDone} />}
      {phase === "onboarding" && <OnboardingScreen onStart={finishOnboarding} />}
      {phase === "app" && <WebViewScreen initialUrl={startUrl} />}
    </SafeAreaProvider>
  );
}
