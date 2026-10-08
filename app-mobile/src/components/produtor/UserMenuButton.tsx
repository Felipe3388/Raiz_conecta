import { View } from "react-native";
import { PressableScale } from "@/components/motion/PressableScale";
import { SignOutConfirm } from "@/components/ui/SignOutConfirm";
import { useProducerIdentity } from "@/hooks/useProducerIdentity";
import { useUserMenu } from "@/hooks/useUserMenu";
import { spacing } from "@/theme";
import { UserAvatar } from "./UserAvatar";
import { UserMenu } from "./UserMenu";

// O ícone da conta no canto do cabeçalho (onde ficava o "Sair"): abre o menu do usuário.
export function UserMenuButton() {
  const { initials, emoji } = useProducerIdentity();
  const menu = useUserMenu();

  return (
    <>
      <View ref={menu.buttonRef} collapsable={false} style={{ marginRight: spacing.md }}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Menu da conta"
          aria-expanded={menu.isOpen}
          hitSlop={6}
          onPress={menu.open}
        >
          <UserAvatar initials={initials} emoji={emoji} />
        </PressableScale>
      </View>

      <UserMenu visible={menu.isOpen} anchor={menu.anchor} onClose={menu.close} onSelect={menu.select} />

      <SignOutConfirm
        visible={menu.isConfirmingSignOut}
        isLoading={menu.isSigningOut}
        onConfirm={menu.confirmSignOut}
        onCancel={menu.cancelSignOut}
      />
    </>
  );
}
