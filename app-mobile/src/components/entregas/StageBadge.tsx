import { Badge } from "@/components/ui/Badge";
import { STAGE_INFO } from "@/content/deliveryTexts";
import type { DeliveryStage } from "@/types/delivery";

// A etapa da entrega em um selo (A separar, Pronta, Com a logística...).
export function StageBadge({ stage }: { stage: DeliveryStage }) {
  const info = STAGE_INFO[stage];
  return <Badge label={info.label} variant={info.tone} dot />;
}
