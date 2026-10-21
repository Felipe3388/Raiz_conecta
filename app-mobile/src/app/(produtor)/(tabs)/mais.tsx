import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { ScaleBanner } from "@/components/produtor/ScaleBanner";
import { UserAvatar } from "@/components/produtor/UserAvatar";
import { FormScreen } from "@/components/ui/FormScreen";
import { LegalModal } from "@/components/ui/LegalModal";
import { SettingsGroup } from "@/components/ui/SettingsGroup";
import { SettingsRow } from "@/components/ui/SettingsRow";
import { SignOutConfirm } from "@/components/ui/SignOutConfirm";
import { PRIVACY_POLICY, TERMS_OF_USE } from "@/content/legalDocuments";
import { MORE_SECTIONS, SIGN_OUT_ITEM } from "@/content/moreMenu";
import { useMoreScreen } from "@/hooks/useMoreScreen";
import { elevation, colors, radius, spacing, typography } from "@/theme";

// Espaço no fim para o botão de ajuda não cobrir a última linha.
const BOTTOM_SPACE = 96;

// Mais: tudo o que não cabe na barra, no estilo da aba Mais do Mercado Livre. Perfil, balança, configurações,
// privacidade, termos e ajuda ficam aqui; o menu do ícone da conta guarda só o perfil e a saída.
export default function MaisScreen() {
  const screen = useMoreScreen();
  const { identity } = screen;

  return (
    <FormScreen edges={[]} centered={false} animated={false} bottomSpace={BOTTOM_SPACE}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${identity.name}. Ver meu perfil`}
        onPress={() => screen.run("profile")}
        pressedScale={0.985}
        style={styles.identity}
      >
        <UserAvatar initials={identity.initials} emoji={identity.emoji} size={56} />
        <View style={styles.identityText}>
          <Text style={styles.name} numberOfLines={1}>
            {identity.name}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {identity.email}
          </Text>
          <Text style={styles.link}>Ver meu perfil</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
      </PressableScale>

      {screen.needsScale && <ScaleBanner onPress={screen.goToScale} />}

      {MORE_SECTIONS.map((section) => (
        <SettingsGroup key={section.id} title={section.title}>
          {section.items.map((item) => (
            <SettingsRow
              key={item.id}
              icon={item.icon}
              label={item.label}
              description={item.id === "scale" ? screen.scaleDescription : item.description}
              onPress={() => screen.run(item.id)}
            />
          ))}
        </SettingsGroup>
      ))}

      <SettingsGroup>
        <SettingsRow
          icon={SIGN_OUT_ITEM.icon}
          label={SIGN_OUT_ITEM.label}
          tone={SIGN_OUT_ITEM.tone}
          onPress={() => screen.run(SIGN_OUT_ITEM.id)}
        />
      </SettingsGroup>

      <LegalModal
        document={TERMS_OF_USE}
        icon="document-text-outline"
        visible={screen.openDocument === "terms"}
        onClose={screen.closeDocument}
        backLabel="Voltar"
      />
      <LegalModal
        document={PRIVACY_POLICY}
        icon="shield-checkmark-outline"
        visible={screen.openDocument === "privacy"}
        onClose={screen.closeDocument}
        backLabel="Voltar"
      />
      <SignOutConfirm
        visible={screen.signOut.isConfirming}
        isLoading={screen.signOut.isSigningOut}
        onConfirm={screen.signOut.confirm}
        onCancel={screen.signOut.cancel}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    padding: spacing.md,
    backgroundColor: colors.surface,
    boxShadow: elevation.card,
    borderRadius: radius.lg,
  },
  identityText: { flex: 1, gap: 2 },
  name: { ...typography.button, fontSize: 18, color: colors.text },
  email: { ...typography.hint, color: colors.textMuted },
  link: { ...typography.hint, fontWeight: "700", color: colors.primaryPressed },
});
