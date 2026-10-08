import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { AvatarPicker } from "@/components/produtor/AvatarPicker";
import { LockedField } from "@/components/produtor/LockedField";
import { UserAvatar } from "@/components/produtor/UserAvatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { FormScreen } from "@/components/ui/FormScreen";
import { Input } from "@/components/ui/Input";
import { LoadError } from "@/components/ui/LoadError";
import { PageLoader } from "@/components/ui/PageLoader";
import { SectionCard } from "@/components/ui/SectionCard";
import { useProducerIdentity } from "@/hooks/useProducerIdentity";
import { useProdutorData } from "@/hooks/useProdutorData";
import { useProfileScreen } from "@/hooks/useProfileScreen";
import { maskDocument } from "@/lib/format/masks";
import { colors, radius, spacing, typography } from "@/theme";

// Espaço no fim para o botão de ajuda não cobrir "Excluir Conta".
const BOTTOM_SPACE = 96;

// Meu Perfil: o ícone da conta e os dados dela. E-mail e documento são travados; o resto pode ser editado.
export default function PerfilScreen() {
  const { email } = useProdutorData();
  const identity = useProducerIdentity();
  const perfil = useProfileScreen(email, identity.setName);

  if (perfil.status === "loading") return <PageLoader />;
  if (perfil.status === "error" || !perfil.profile) return <LoadError onRetry={perfil.reload} />;

  const { profile, form } = perfil;

  return (
    <FormScreen edges={["bottom"]} centered={false} animated={false} bottomSpace={BOTTOM_SPACE}>
      <View style={styles.top}>
        <UserAvatar initials={identity.initials} emoji={identity.emoji} size={88} />
        <Text style={styles.name}>{identity.name}</Text>
        <Badge label="Perfil: Produtor Rural" variant="success" dot />
      </View>

      <SectionCard
        title="Seu ícone"
        icon="happy-outline"
        description="Escolha como você aparece no canto da tela. Você pode trocar quando quiser."
      >
        <AvatarPicker initials={identity.initials} value={identity.emoji} onChange={identity.setEmoji} />
      </SectionCard>

      <SectionCard title="Dados Principais" icon="person-outline" description="Como você aparece para os mercados.">
        <LockedField label="E-mail" value={profile.email} />
        <LockedField label={profile.tipoDoc} value={maskDocument(profile.documento, profile.tipoDoc)} />
        <Text style={styles.locked}>Dados sensíveis travados por segurança. Contate o suporte para alterar.</Text>
        <Input
          label="Nome Fantasia / Razão Social"
          autoCapitalize="words"
          value={form.nomeFantasia}
          onChangeText={(text) => perfil.setField("nomeFantasia", text)}
        />
        <Input
          label="Telefone / WhatsApp"
          keyboardType="phone-pad"
          value={form.telefone}
          onChangeText={(text) => perfil.setField("telefone", text)}
        />
      </SectionCard>

      <SectionCard title="Endereço de Operação" icon="location-outline">
        <Input
          label="CEP"
          keyboardType="number-pad"
          value={form.cep}
          onChangeText={(text) => perfil.setField("cep", text)}
        />
        <Input label="Número" value={form.numero} onChangeText={(text) => perfil.setField("numero", text)} />
        <Input
          label="Rua / Estrada / Logradouro"
          autoCapitalize="words"
          value={form.rua}
          onChangeText={(text) => perfil.setField("rua", text)}
        />
        <Input
          label="Cidade"
          autoCapitalize="words"
          value={form.cidade}
          onChangeText={(text) => perfil.setField("cidade", text)}
        />
        <Input
          label="Estado (UF)"
          autoCapitalize="characters"
          maxLength={2}
          value={form.estado}
          onChangeText={(text) => perfil.setField("estado", text)}
        />
      </SectionCard>

      <SectionCard title="Senha e Segurança" icon="shield-checkmark-outline" iconColor={colors.warning}>
        <Input
          label="Nova Senha"
          placeholder="Mínimo 8 caracteres"
          secure
          autoComplete="new-password"
          value={perfil.newPassword}
          onChangeText={perfil.setNewPassword}
        />
        <Input
          label="Confirmar Nova Senha"
          placeholder="Repita a senha"
          secure
          autoComplete="new-password"
          value={perfil.confirmPassword}
          onChangeText={perfil.setConfirmPassword}
        />
      </SectionCard>

      <Button label="Salvar Alterações" size="lg" onPress={perfil.requestSave} />
      <Button label="Falar com Suporte" variant="outline" onPress={perfil.contactSupport} />

      <View style={styles.danger}>
        <View style={styles.dangerHeader}>
          <Ionicons name="warning-outline" size={20} color={colors.danger} />
          <Text style={styles.dangerTitle}>Zona de Perigo</Text>
        </View>
        <Text style={styles.dangerText}>
          Excluir a conta apaga seus dados e suas ofertas. Essa ação não pode ser desfeita.
        </Text>
        <Button label="Excluir Conta" variant="danger" onPress={perfil.requestDelete} />
      </View>

      <ConfirmModal
        visible={perfil.isConfirmingSave}
        title="Salvar alterações?"
        description="Seus dados serão atualizados na plataforma."
        confirmLabel="Sim, salvar"
        cancelLabel="Cancelar"
        isLoading={perfil.isSaving}
        onConfirm={perfil.confirmSave}
        onCancel={perfil.cancelSave}
      />
      <ConfirmModal
        visible={perfil.isConfirmingDelete}
        variant="danger"
        title="Excluir conta?"
        description="Todos os seus dados serão apagados para sempre. Tem certeza?"
        confirmLabel="Sim, excluir minha conta"
        cancelLabel="Cancelar"
        isLoading={perfil.isDeleting}
        onConfirm={perfil.confirmDelete}
        onCancel={perfil.cancelDelete}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: "center", gap: spacing.sm + 2 },
  name: { ...typography.heading, color: colors.text, textAlign: "center" },
  locked: { ...typography.hint, color: colors.textMuted },
  danger: {
    gap: spacing.sm + 4,
    padding: spacing.md,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radius.lg,
  },
  dangerHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dangerTitle: { ...typography.heading, fontSize: 18, color: colors.dangerText },
  dangerText: { ...typography.body, color: colors.dangerText },
});
