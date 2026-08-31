import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, radius, spacing } from '../theme/colors';

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
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>{this.state.error.message}</Text>
            {this.state.info ? <Text style={styles.stack}>{this.state.info}</Text> : null}
            <Button title="Try again" onPress={() => this.setState({ error: null, info: null })} style={styles.button} />
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 60 },
  scroll: { padding: spacing.lg },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  message: { fontSize: 14, color: colors.danger, marginBottom: spacing.md },
  stack: { fontSize: 11, color: colors.textMuted, backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing.sm },
  button: { marginTop: spacing.lg },
});
