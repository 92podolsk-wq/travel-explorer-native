import { Component, type ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { error: Error | null };

// A deliberately self-contained fallback: it must not depend on the store,
// i18n, or navigation, since any of those could be what crashed in the
// first place. Plain RN primitives only.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle-outline" size={40} color="#c14b4b" />
          <Text style={styles.title}>Что-то пошло не так</Text>
          <Text style={styles.subtitle}>Приложение столкнулось с ошибкой. Попробуйте перезапустить экран.</Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonLabel}>Повторить</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: "#f4f3ef" },
  title: { fontSize: 18, fontWeight: "800", color: "#1a1a1a", marginTop: 14, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#6a6a68", marginTop: 8, textAlign: "center" },
  button: { backgroundColor: "#287f72", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28, marginTop: 20 },
  buttonLabel: { color: "#fff", fontSize: 14, fontWeight: "700" }
});
