import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { useSettings } from "@/hooks/useSettings";

// Sem animações para quem pediu: "reduzir movimento" no aparelho ou "Reduzir animações" nas Configurações do app.
export function useReducedMotion(): boolean {
  const [deviceReduced, setReduced] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (isMounted) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return deviceReduced || settings.reduceMotion;
}
