import { useEffect, useRef } from "react";
import { View, StyleSheet, Image, Animated, Easing } from "react-native";
import { StatusBar } from "expo-status-bar";
import { COLORS, LOADING_DURATION_MS } from "@/constants";

/**
 * Branded loading screen shown right after the native splash. Same orange
 * background and a large static white logo so the handoff from the splash is
 * seamless (no blink), with a thin loading bar filling along the bottom.
 */
export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: LOADING_DURATION_MS,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(onDone, LOADING_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onDone, progress]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={COLORS.brand} />

      <View style={styles.center}>
        <Image source={require("../assets/splash-icon.png")} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.barWrap}>
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.brand,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 300,
    height: 120,
  },
  barWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 64,
    alignItems: "center",
  },
  barTrack: {
    width: 180,
    height: 4,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
  },
  barFill: {
    height: 4,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
});
