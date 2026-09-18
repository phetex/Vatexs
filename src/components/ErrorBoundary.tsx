import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Appearance, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { darkColors, lightColors, radius, spacing } from '../theme/colors';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info: info.componentStack ?? null });
  }

  componentDidMount() {
    // React's error boundary only catches render/lifecycle errors — this
    // catches everything else (event handlers, async callbacks) so a crash
    // shows a readable screen instead of the app just closing.
    const g = globalThis as any;
    if (g.ErrorUtils?.setGlobalHandler) {
      g.ErrorUtils.setGlobalHandler((error: Error) => {
        this.setState({ error, info: null });
      });
    }
  }

  render() {
    if (this.state.error) {
      // No ThemeProvider to read from here (this boundary wraps it), so fall
      // back to the system color scheme rather than always rendering light.
      const colors = Appearance.getColorScheme() === 'dark' ? darkColors : lightColors;
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={[styles.title, { color: colors.text }]}>Something went wrong</Text>
            <Text style={[styles.message, { color: colors.textMuted }]}>
              {__DEV__
                ? this.state.error.message
                : "We hit an unexpected error. Please try again — if it keeps happening, reach out to support@vatexs.store."}
            </Text>
            {__DEV__ && this.state.info ? (
              <Text style={[styles.stack, { color: colors.textMuted, backgroundColor: colors.surface }]}>{this.state.info}</Text>
            ) : null}
            <Button title="Try again" onPress={() => this.setState({ error: null, info: null })} style={styles.button} />
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  scroll: { padding: spacing.lg },
  title: { fontSize: 18, fontWeight: '800', marginBottom: spacing.sm },
  message: { fontSize: 14, marginBottom: spacing.md },
  stack: { fontSize: 11, borderRadius: radius.sm, padding: spacing.sm },
  button: { marginTop: spacing.lg },
});
