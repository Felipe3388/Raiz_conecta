import { useEffect, useMemo, useState } from "react";
import { formatPriceInput, parsePrice, priceKey } from "@/lib/pricing/price";
import { startNegotiation, type NegotiationInput } from "@/lib/pricing/negotiation";
import { useNegotiation } from "./useNegotiation";
import { usePricing } from "./usePricing";
import { useProdutorData } from "./useProdutorData";

// A negociação só começa de verdade em "Iniciar"; até lá ela guarda este valor sem uso.
const IDLE_INPUT: NegotiationInput = { marketPrice: 1, producerPrice: null, suggestedPrice: null };

export const MARKET_ERROR = "Informe o preço que o pedido paga, por exemplo 45,00.";
export const PRODUCER_ERROR =
  "O seu preço precisa ser um valor válido, por exemplo 46,00. Deixe vazio para testar sem preço.";

// Controller do Simulador de preço (tela de teste): monta um pedido de mentira, roda o leilão inverso passo a passo
// e, se a pessoa quiser, guarda as respostas para ver o preço sugerido se ajustando.
export function useSimulatorScreen() {
  const data = useProdutorData();
  const pricing = usePricing();
  const names = useMemo(() => data.products.map((product) => product.nome), [data.products]);
  const defaultProduct = names[0] ?? "";

  const [chosen, setChosen] = useState<string | null>(null);
  const produto = chosen ?? defaultProduct;
  const unidade = data.products.find((product) => product.nome === produto)?.unidadePadrao ?? "unidade";

  const [marketText, setMarketText] = useState("");
  const [producerText, setProducerText] = useState("");
  const [saveResponses, setSaveResponses] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedBefore, setSuggestedBefore] = useState<number | null>(null);

  const negotiation = useNegotiation(IDLE_INPUT, produto, (response) => {
    if (saveResponses) void pricing.recordResponse(response).catch(() => {});
  });

  // Ao trocar de produto, o pedido de teste começa com o que o app já sabe dele.
  useEffect(() => {
    const open = data.mural.find((demand) => priceKey(demand.produto) === priceKey(produto));
    const mine = pricing.priceOf(produto);
    setMarketText(open?.precoMedio ? formatPriceInput(open.precoMedio) : "");
    setProducerText(mine === null ? "" : formatPriceInput(mine));
    setRunning(false);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produto]);

  const marketPrice = parsePrice(marketText);
  const producerPrice = producerText.trim() === "" ? null : parsePrice(producerText);
  const producerInvalid = producerText.trim() !== "" && producerPrice === null;
  const suggested = pricing.suggestedOf(produto);

  const input: NegotiationInput | null =
    marketPrice === null || producerInvalid
      ? null
      : { marketPrice, producerPrice, suggestedPrice: suggested?.price ?? null };

  // As propostas que o mercado fará, antes de começar.
  const preview = useMemo(
    () => (input ? startNegotiation(input) : null),
    [input?.marketPrice, input?.producerPrice, input?.suggestedPrice],
  );

  function start() {
    if (marketPrice === null) {
      setError(MARKET_ERROR);
      return;
    }
    if (producerInvalid || !input) {
      setError(PRODUCER_ERROR);
      return;
    }
    setError(null);
    setSuggestedBefore(suggested?.price ?? null);
    negotiation.restart(input);
    setRunning(true);
  }

  return {
    names,
    produto,
    unidade,
    chooseProduct: setChosen,
    marketText,
    setMarketText: (text: string) => {
      setError(null);
      setMarketText(text);
    },
    producerText,
    setProducerText: (text: string) => {
      setError(null);
      setProducerText(text);
    },
    marketPrice,
    producerPrice,
    suggested,
    suggestedBefore,
    preview,
    error,
    saveResponses,
    setSaveResponses,
    running,
    negotiation,
    start,
    stop: () => setRunning(false),
  };
}
