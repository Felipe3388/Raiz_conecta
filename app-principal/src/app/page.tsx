import Image from "next/image";
import Link from "next/link";
import { Check, ArrowRight, Store, Sprout, Handshake } from "lucide-react";
import { HeroFlow } from "@/components/landing/HeroFlow";
import { LandingActions } from "@/components/landing/LandingActions";

// Os quatro passos são mesmo uma sequência (do pedido ao recebimento), por isso levam número.
const STEPS = [
  { title: "O mercado monta a cotação", text: "Escolhe os produtos do catálogo e quantos quilos quer de cada um. O preço de referência mostra a estimativa antes de enviar." },
  { title: "Os produtores da região ofertam", text: "Cada produtor atende a parte que tem. Vários juntos completam um pedido grande." },
  { title: "O pedido ganha fornecedores", text: "O mercado acompanha as quantidades ofertadas. Cada produtor contribui com o que consegue entregar." },
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
      "Organize os pedidos e as entregas pelo celular.",
    ],
    cta: { href: "/login?modo=cadastro&tipo=produtor", label: "Criar conta de produtor" },
  },
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
      {/* Demonstração ilustrativa da conexão direta entre mercado e produtores. */}
      <section className="overflow-hidden">
        <div className={`${container} grid lg:grid-cols-[1.05fr_1fr] gap-14 lg:gap-10 items-center pt-14 pb-20 md:pt-20 md:pb-28`}>
          <div>
            <h1 className="rc-display-1 max-w-[12ch]">
              Quem produz encontra quem precisa.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-600 leading-relaxed max-w-[46ch]">
              O mercado publica o que precisa. Produtores da região fazem suas ofertas e, juntos, completam o pedido —
              direto do campo, sem atravessador.
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

      <section id="conexao" className="bg-mata text-white scroll-mt-20">
        <div className={`${container} py-20 md:py-24 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center`}>
          <div>
            <span className="inline-flex items-center gap-2 text-green-200 font-semibold"><Handshake size={20} aria-hidden="true" /> Conexão direta</span>
            <h2 className="rc-display-2 mt-3 !text-white max-w-[17ch]">Duas pontas, uma oportunidade.</h2>
            <p className="mt-5 text-lg text-green-100 leading-relaxed max-w-[50ch]">
              Mercados encontrando produtos frescos. Produtores encontrando compradores. A plataforma aproxima os dois lados
              e organiza as ofertas, inclusive quando vários produtores atendem um mesmo pedido.
            </p>
            <p className="mt-6 text-green-100">Sem atravessadores, com visibilidade das quantidades e do andamento da compra.</p>
          </div>
          <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-4 items-center" aria-label="Conexão entre mercado e produtor">
            <div className="rounded-2xl bg-white/10 border border-white/20 p-6 text-center">
              <Store className="mx-auto text-green-200" size={38} aria-hidden="true" />
              <h3 className="text-xl font-bold mt-3">Mercados</h3>
              <p className="mt-2 text-sm text-green-100">Publicam a demanda</p>
            </div>
            <ArrowRight className="mx-auto rotate-90 sm:rotate-0 text-green-300" size={28} aria-hidden="true" />
            <div className="rounded-2xl bg-white/10 border border-white/20 p-6 text-center">
              <Sprout className="mx-auto text-green-200" size={38} aria-hidden="true" />
              <h3 className="text-xl font-bold mt-3">Produtores</h3>
              <p className="mt-2 text-sm text-green-100">Respondem com ofertas</p>
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
