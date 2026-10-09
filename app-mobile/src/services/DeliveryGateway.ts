import type { Delivery, WeighingInput } from "@/types/delivery";

// As entregas do produtor e a pesagem delas. O site ainda não tem nada disto: só existe a versão simulada
// (MockDeliveryService). Cada método devolve a entrega já atualizada.
export interface DeliveryGateway {
  // As entregas do produtor: uma por oferta. No servidor elas nascem quando o mercado fecha o pedido.
  listDeliveries(email: string): Promise<Delivery[]>;
  // Registra um lote pesado. As pesagens se somam até o peso do pedido.
  addWeighing(email: string, deliveryId: string, input: WeighingInput): Promise<Delivery>;
  // Apaga uma pesagem registrada por engano (só antes de entregar à logística).
  removeWeighing(email: string, deliveryId: string, weighingId: string): Promise<Delivery>;
  // O produtor entregou à logística. O peso que valeu é o das pesagens registradas até aqui.
  handOver(email: string, deliveryId: string): Promise<Delivery>;
  // Só no modo simulado: faz de conta que o mercado pesou ao receber. Na vida real quem pesa é o mercado,
  // no app dele, e o resultado chega pelo servidor.
  simulateReceipt?(email: string, deliveryId: string, input: WeighingInput): Promise<Delivery>;
}
