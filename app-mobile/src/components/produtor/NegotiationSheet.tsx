import { StyleSheet, View } from "react-native";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { useNegotiation } from "@/hooks/useNegotiation";
import { usePricing } from "@/hooks/usePricing";
import { spacing } from "@/theme";
import type { Demand } from "@/types/produtor";
import { NegotiationPanel } from "./NegotiationPanel";

interface NegotiationSheetProps {
  demand: Demand;
  quantity: number;
  // O preço que o produtor pede por este produto.
  producerPrice: number;
  // O pedido paga isto (a estimativa do pedido).
  marketPrice: number;
  isSending: boolean;
  // Fecha a oferta ao preço combinado.
  onConfirm: (price: number) => void;
  onEditPrice: () => void;
  onClose: () => void;
}

// A negociação de um pedido do Mural, numa folha: o mercado começa baixo e sobe a cada recusa.
// Existe só enquanto a negociação dura (cada pedido começa do zero), por isso o estado nasce aqui.
export function NegotiationSheet({
  demand,
  quantity,
  producerPrice,
  marketPrice,
  isSending,
  onConfirm,
  onEditPrice,
  onClose,
}: NegotiationSheetProps) {
  const pricing = usePricing();
  const negotiation = useNegotiation(
    { marketPrice, producerPrice, suggestedPrice: pricing.suggestedOf(demand.produto)?.price ?? null },
    demand.produto,
    // Se a resposta não for guardada, a negociação segue igual; só o preço sugerido deixa de aprender.
    (response) => void pricing.recordResponse(response).catch(() => {}),
  );
  const { state } = negotiation;

  const finish =
    state.outcome === "deal" && state.dealPrice !== null ? (
      <View style={styles.finish}>
        <Button
          label="Confirmar oferta"
          size="lg"
          isLoading={isSending}
          onPress={() => onConfirm(state.dealPrice as number)}
        />
        <Button label="Voltar" variant="ghost" disabled={isSending} onPress={onClose} />
      </View>
    ) : (
      <View style={styles.finish}>
        <Button label="Mudar meu preço" variant="amberOutline" onPress={onEditPrice} />
        <Button label="Fechar" variant="ghost" onPress={onClose} />
      </View>
    );

  return (
    <BottomSheet
      visible
      onClose={onClose}
      icon="swap-vertical-outline"
      title={`Negociar ${demand.produto}`}
      subtitle={`${quantity} ${demand.unidade.toLowerCase()} em oferta`}
    >
      <View style={styles.body}>
        <NegotiationPanel
          negotiation={negotiation}
          unidade={demand.unidade}
          producerPrice={producerPrice}
          marketPrice={marketPrice}
          quantity={quantity}
          finish={finish}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.md },
  finish: { alignSelf: "stretch", gap: spacing.xs, paddingTop: spacing.xs },
});
