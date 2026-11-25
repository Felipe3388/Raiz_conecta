import Image from "next/image";
import Link from "next/link";
import { Check, CheckCircle2, Radio, Scale, Timer } from "lucide-react";
import { HeroFlow } from "@/components/landing/HeroFlow";
import { LandingActions } from "@/components/landing/LandingActions";

// Os quatro passos são mesmo uma sequência (do pedido ao recebimento), por isso levam número.
const STEPS = [
  { title: "O mercado monta a cotação", text: "Escolhe os produtos do catálogo e quantos quilos quer de cada um. O preço de referência mostra a estimativa antes de enviar." },
  { title: "Os produtores da região ofertam", text: "Cada produtor atende a parte que tem. Vários juntos completam um pedido grande." },
  { title: "A pesagem é guiada", text: "No dia da entrega, o app diz o que pesar e só registra quando o peso fica dentro da faixa combinada." },
  { title: "O mercado recebe e avalia", text: "Confere o pedido, acompanha tudo pelo painel e avalia o produtor." },
];

const AUDIENCES = [
  {
    id: "mercado",
    title: "Para o mercado",
    image: "/landing/mercado.jpg",
    alt: "Gôndola de hortifruti com verduras, pimentões e abóboras",
    position: "object-center",
    points: [
      "Compre direto de quem planta, sem intermediário no meio.",
      "Uma cotação chega a vários produtores de uma vez.",
      "Acompanhe as ofertas e cancele em até 7 dias úteis.",
    ],
    cta: { href: "/login?modo=cadastro&tipo=mercado", label: "Criar conta de mercado" },
  },
  {
    id: "produtor",
    title: "Para o produtor",
    image: "/landing/campo.jpg",
    alt: "Plantação de trigo com dois produtores apertando as mãos ao fundo",
    position: "object-bottom",
    points: [
      "Veja os pedidos dos mercados próximos para o que você produz.",
      "Atenda só a quantidade que você tem disponível.",
      "Separe e pese os pedidos pelo app, com a balança conectada.",
    ],
    cta: { href: "/login?modo=cadastro&tipo=produtor", label: "Criar conta de produtor" },
  },
];

const SCALE_POINTS = [
  { icon: CheckCircle2, text: "Tolerância de 2% para mais ou para menos do que o mercado pediu" },
  { icon: Timer, text: "O peso só é registrado depois de ficar parado por 5 segundos" },
  { icon: Radio, text: "Peso ao vivo no app e no site, com aviso quando a balança perde o sinal" },
];

// Os Objetivos de Desenvolvimento Sustentável da ONU com que o projeto se compromete.
const ODS = [
  { number: 2, title: "Fome zero e agricultura sustentável", text: "O mercado compra o que precisa e o produtor escoa a safra, com menos perda no caminho." },
  { number: 8, title: "Trabalho decente e crescimento econômico", text: "Sem atravessador, a margem fica com quem planta." },
  { number: 12, title: "Consumo e produção responsáveis", text: "Pedido certo, peso conferido e menos desperdício na entrega." },
];

const container = "max-w-6xl mx-auto px-5 md:px-8";

export default function HomePage() {
  return (
    <div className="bg-gray-50">
      {/* O produto em ação logo de cara: um pedido de verdade passando pelas três pontas. */}
      <section className="overflow-hidden">
        <div className={`${container} grid lg:grid-cols-[1.05fr_1fr] gap-14 lg:gap-10 items-center pt-14 pb-20 md:pt-20 md:pb-28`}>
          <div>
            <h1 className="rc-display-1 max-w-[12ch]">
              O mercado pede. O produtor da região entrega.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-600 leading-relaxed max-w-[46ch]">
              Cotação, oferta e pesagem no mesmo lugar, sem atravessador. A balança conectada confere cada quilo antes
              de o pedido sair.
            </p>
            <div className="mt-9">
              <LandingActions />
            </div>
            <p className="mt-5 text-sm text-gray-600">
              Já tem conta?{" "}
              <Link href="/login" className="font-bold text-green-700 underline-offset-4 hover:underline">
                Entrar
              </Link>
            </p>
          </div>
          <HeroFlow />
        </div>
      </section>

      <section id="como-funciona" className="bg-white border-y border-gray-200 scroll-mt-20">
        <div className={`${container} py-20 md:py-24`}>
          <h2 className="rc-display-2">Como funciona</h2>
          <p className="mt-3 text-gray-600 text-lg max-w-[52ch]">Do pedido ao recebimento, em quatro passos.</p>
          <ol className="mt-12 grid gap-10 md:grid-cols-4 md:gap-8">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid place-items-center w-10 h-10 rounded-full bg-green-600 text-white font-display font-bold" aria-hidden="true">
                    {index + 1}
                  </span>
                  {index < STEPS.length - 1 && <span aria-hidden="true" className="hidden md:block flex-1 h-px bg-gray-300" />}
                </div>
                <h3 className="rc-display-3">{step.title}</h3>
                <p className="mt-2 text-gray-600 leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="para-quem" className="scroll-mt-20">
        <div className={`${container} py-20 md:py-24 grid gap-8 md:grid-cols-2`}>
          {AUDIENCES.map((audience) => (
            <article key={audience.id} className="bg-white rounded-3xl border border-gray-200 overflow-hidden flex flex-col">
              <div className="relative aspect-[16/10]">
                <Image src={audience.image} alt={audience.alt} fill sizes="(min-width: 768px) 560px, 100vw" className={`object-cover ${audience.position}`} />
              </div>
              <div className="p-7 md:p-9 flex flex-col flex-1">
                <h2 className="rc-display-2 !text-2xl md:!text-3xl">{audience.title}</h2>
                <ul className="mt-5 space-y-3 flex-1">
                  {audience.points.map((point) => (
                    <li key={point} className="flex gap-3 text-gray-700 leading-relaxed">
                      <Check size={20} className="text-green-600 shrink-0 mt-0.5" aria-hidden="true" /> {point}
                    </li>
                  ))}
                </ul>
                <Link href={audience.cta.href} className="mt-7 inline-flex self-start items-center h-11 px-5 rounded-xl border-2 border-green-600 text-green-800 font-bold hover:bg-green-50 transition-colors">
                  {audience.cta.label}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="balanca" className="bg-mata text-white scroll-mt-20 overflow-hidden">
        <div className={`${container} py-20 md:py-24 grid gap-14 lg:grid-cols-[1.1fr_1fr] items-center`}>
          <div>
            <span className="inline-flex items-center gap-2 text-milho font-semibold"><Scale size={18} aria-hidden="true" /> Balança conectada</span>
            <h2 className="rc-display-2 mt-3 !text-white max-w-[16ch]">A balança confere cada quilo.</h2>
            <p className="mt-5 text-lg text-green-100 leading-relaxed max-w-[50ch]">
              O módulo da balança manda o peso para o Raiz Conecta pelo Wi-Fi. O app guia a separação produto por produto
              e só registra o que está dentro do combinado: nem a menos, nem a mais.
            </p>
            <ul className="mt-8 space-y-4">
              {SCALE_POINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-3 text-green-50">
                  <Icon size={20} className="text-milho shrink-0 mt-0.5" aria-hidden="true" /> {text}
                </li>
              ))}
            </ul>
          </div>
          {/* O celular "sai" da borda de baixo da faixa: mostra a parte da tela que importa (o pedido, a faixa e o peso). */}
          <div className="relative mx-auto w-full max-w-[320px] self-end -mb-20 md:-mb-24">
            <div className="rounded-t-[2.6rem] bg-gray-950 px-2.5 pt-2.5 shadow-2xl ring-1 ring-white/10">
              <Image
                src="/landing/app-pesagem.png"
                alt="Tela de pesagem do app com a Balança RC-01 conectada: pode pesar entre 7,84 e 8,16 kg, a balança marca 8 kg e o peso está estabilizando dentro da faixa"
                width={780}
                height={1000}
                sizes="320px"
                className="rounded-t-[2.1rem] w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="ods" className="bg-white border-b border-gray-200">
        <div className={`${container} py-16 md:py-20`}>
          <h2 id="ods" className="rc-display-2">Por que importa</h2>
          <p className="mt-3 text-gray-600 max-w-[60ch]">O projeto segue três Objetivos de Desenvolvimento Sustentável da ONU.</p>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {ODS.map((goal) => (
              <div key={goal.number} className="border-t-2 border-green-600 pt-5">
                <p className="font-display text-4xl font-extrabold text-green-700">ODS {goal.number}</p>
                <h3 className="rc-display-3 mt-2 !text-lg">{goal.title}</h3>
                <p className="mt-1.5 text-gray-600 leading-relaxed">{goal.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className={`${container} py-20 md:py-24 flex flex-col md:flex-row md:items-end justify-between gap-8`}>
          <div>
            <h2 className="rc-display-2 max-w-[18ch]">Comece pelo cadastro.</h2>
            <p className="mt-3 text-lg text-gray-600 max-w-[50ch]">
              Leva poucos minutos. A equipe confere o documento e avisa por e-mail quando o acesso for liberado.
            </p>
          </div>
          <LandingActions />
        </div>
      </section>
    </div>
  );
}
