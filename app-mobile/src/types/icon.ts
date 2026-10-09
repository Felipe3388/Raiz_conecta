import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

// Nome de um ícone do app. Fica num lugar só para as telas, os textos e as regras não repetirem de onde ele vem.
export type IconName = ComponentProps<typeof Ionicons>["name"];
