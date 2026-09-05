import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, BackHandler, Linking, Pressable, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewNavigation } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS, SITE_URL, LANDING_REDIRECT_TO, STORAGE_KEYS } from "@/constants";

const APP_USER_AGENT_TAG = "ESIM4UApp/1.0";

// True when the URL is the marketing landing page (site root), which we never
// show inside the app.
function isLandingUrl(url: string): boolean {
  const clean = url.split("?")[0].split("#")[0].replace(/\/+$/, "");
  return clean === SITE_URL || clean === "https://www.esim4u.uk" || clean === "http://esim4u.uk";
}

export default function WebViewScreen({ initialUrl }: { initialUrl: string }) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const webRef = useRef<WebView>(null);
  const canGoBack = useRef(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Runs before the page renders: follow the device theme, lock zoom, and flag
  // that we're inside the app.
  const injectedBeforeLoad = useMemo(() => {
    const theme = isDark ? "dark" : "light";
    return `(function(){try{
      window.__ESIM4U_APP__ = true;
      localStorage.setItem('esim4u:dashboard-theme','${theme}');
      localStorage.setItem('esim4u:admin-theme','${theme}');
    }catch(e){}})(); true;`;
  }, [isDark]);

  // Force a fixed viewport so pinch/zoom can't change the layout.
  const lockZoomJs = `(function(){try{
    var m=document.querySelector('meta[name=viewport]');
    if(!m){m=document.createElement('meta');m.setAttribute('name','viewport');document.getElementsByTagName('head')[0].appendChild(m);}
    m.setAttribute('content','width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
  }catch(e){}})(); true;`;

  // Hardware back navigates WebView history before exiting the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack.current) {
        webRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  // Re-apply the theme when the device switches light/dark.
  useEffect(() => {
    webRef.current?.injectJavaScript(injectedBeforeLoad);
    webRef.current?.reload();
  }, [injectedBeforeLoad]);

  const onNavChange = useCallback((nav: WebViewNavigation) => {
    canGoBack.current = nav.canGoBack;

    // Infer login state from the current page so the next launch knows whether
    // to show "Get Started" (logged out) or go straight to the dashboard.
    const url = nav.url || "";
    if (url.includes("/dashboard")) {
      AsyncStorage.setItem(STORAGE_KEYS.loggedIn, "1").catch(() => {});
    } else if (/\/login(?:[/?#]|$)/.test(url) || isLandingUrl(url)) {
      AsyncStorage.setItem(STORAGE_KEYS.loggedIn, "0").catch(() => {});
    }
  }, []);

  const onShouldStart = useCallback((req: { url: string }) => {
    const url = req.url;

    // Non-web schemes (mailto/tel/whatsapp/etc.) open in the OS.
    if (!(url.startsWith("http://") || url.startsWith("https://") || url.startsWith("about:"))) {
      Linking.openURL(url).catch(() => {});
      return false;
    }

    // Never show the marketing landing page — send to login instead.
    if (isLandingUrl(url)) {
      webRef.current?.injectJavaScript(`window.location.replace(${JSON.stringify(LANDING_REDIRECT_TO)}); true;`);
      return false;
    }

    return true;
  }, []);

  const reload = useCallback(() => {
    setError(false);
    webRef.current?.reload();
  }, []);

  const bg = isDark ? COLORS.bgDark : COLORS.white;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={["top", "bottom"]}>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={bg} />

      {error ? (
        <View style={[styles.center, { backgroundColor: bg }]}>
          <Text style={[styles.errTitle, isDark && styles.textLight]}>Can&apos;t reach ESIM4U</Text>
          <Text style={[styles.errBody, isDark && styles.textMutedLight]}>
            Check your internet connection and try again.
          </Text>
          <Pressable style={styles.retryBtn} onPress={reload}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          ref={webRef}
          source={{ uri: initialUrl }}
          originWhitelist={["*"]}
          injectedJavaScriptBeforeContentLoaded={injectedBeforeLoad}
          injectedJavaScript={lockZoomJs}
          applicationNameForUserAgent={APP_USER_AGENT_TAG}
          onNavigationStateChange={onNavChange}
          onShouldStartLoadWithRequest={onShouldStart}
          onLoadStart={() => setError(false)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          onHttpError={() => setLoading(false)}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          setSupportMultipleWindows={false}
          setBuiltInZoomControls={false}
          setDisplayZoomControls={false}
          scalesPageToFit={false}
          style={{ backgroundColor: bg }}
        />
      )}

      {loading && !error && (
        <View style={[styles.loadingOverlay, { backgroundColor: bg }]} pointerEvents="none">
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  errTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  errBody: { fontSize: 14, color: COLORS.textMuted, textAlign: "center", marginBottom: 20 },
  textLight: { color: "#E6E8EB" },
  textMutedLight: { color: "#9BA3AF" },
  retryBtn: { backgroundColor: COLORS.brand, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14 },
  retryText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
});
