import { PropsWithChildren, ReactNode, RefObject, useEffect, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BOTTOM_DOCK_HEIGHT, theme } from "../theme";
import { colors } from "../theme/colors";

type Props = PropsWithChildren<{
  footer?: ReactNode;
  scrollRef?: RefObject<ScrollView | null>;
  /** When false, children manage their own scroll (e.g. FlatList). Outer padding/safe area still applied. */
  scrollable?: boolean;
}>;

export function ScreenContainer({ children, footer, scrollRef, scrollable = true }: Props) {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const contentBottomPadding = footer
    ? keyboardVisible
      ? insets.bottom + theme.spacing.lg
      : insets.bottom + BOTTOM_DOCK_HEIGHT + theme.spacing.lg
    : insets.bottom + theme.spacing.xl;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {scrollable ? (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.spacing.sm, paddingBottom: contentBottomPadding }]}
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {children}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.staticOuter,
              { paddingTop: insets.top + theme.spacing.sm, paddingBottom: contentBottomPadding, paddingHorizontal: theme.spacing.md },
            ]}
          >
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
      {footer && !keyboardVisible ? (
        <View style={[styles.footerWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>{footer}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  footerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: colors.surface,
  },
  staticOuter: {
    flex: 1,
    minHeight: 0,
  },
});
