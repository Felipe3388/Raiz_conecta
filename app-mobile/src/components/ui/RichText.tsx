import { Text, type StyleProp, type TextStyle } from "react-native";
import { splitBold } from "@/lib/text/richText";

// Texto com trechos em **negrito**.
export function RichText({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={style}>
      {splitBold(text).map((segment, index) => (
        <Text key={index} style={segment.bold ? { fontWeight: "700" } : undefined}>
          {segment.text}
        </Text>
      ))}
    </Text>
  );
}
