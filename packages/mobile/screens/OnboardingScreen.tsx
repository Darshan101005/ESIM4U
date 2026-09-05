import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants";

/**
 * First-run welcome. "Get Started" takes the user to the login page.
 */
export default function OnboardingScreen({ onStart }: { onStart: () => void }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar style="dark" backgroundColor={COLORS.white} />

      <View style={styles.body}>
        <Image source={require("../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Stay connected, anywhere</Text>
        <Text style={styles.subtitle}>
          Instant eSIM data plans for 190+ countries. Buy, install, and manage your travel data in one place.
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={onStart}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logo: {
    width: 200,
    height: 72,
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: "center",
  },
  button: {
    backgroundColor: COLORS.brand,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    width: "100%",
    shadowColor: COLORS.brand,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  buttonPressed: {
    backgroundColor: COLORS.brandDark,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
