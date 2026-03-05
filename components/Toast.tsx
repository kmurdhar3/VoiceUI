import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, visible, onHide }: ToastProps) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => onHide());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 100,
        left: 20,
        right: 20,
        transform: [{ translateY }],
        opacity,
        zIndex: 9999,
      }}
    >
      <View
        style={{
          backgroundColor: "#1C1C1E",
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: "#333333",
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 14, textAlign: "center" }}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
