import { NextResponse } from "next/server";

// ROTA GET: O catálogo de produtos para o mercado
export async function GET() {

  const produtos = [
    {
      cdProduto: 1,
      nome: "Maçã Gala",
      icone: "🍎",
      unidadePadrao: "Kg",
      categoria: "Frutas",
      preco: 8.5,
    },
    {
      cdProduto: 2,
      nome: "Laranja Pera",
      icone: "🍊",
      unidadePadrao: "Kg",
      categoria: "Frutas",
      preco: 4.2,
    },
    {
      cdProduto: 3,
      nome: "Banana Prata",
      icone: "🍌",
      unidadePadrao: "Kg",
      categoria: "Frutas",
      preco: 5.9,
    },
    {
      cdProduto: 4,
      nome: "Alface Crespa",
      icone: "🥬",
      unidadePadrao: "Kg",
      categoria: "Verduras",
      preco: 12.0, 
    },
    {
      cdProduto: 5,
      nome: "Tomate Carmem",
      icone: "🍅",
      unidadePadrao: "Kg",
      categoria: "Legumes",
      preco: 7.3,
    },
    {
      cdProduto: 6,
      nome: "Cenoura",
      icone: "🥕",
      unidadePadrao: "Kg",
      categoria: "Legumes",
      preco: 4.8,
    },
    {
      cdProduto: 7,
      nome: "Brócolis",
      icone: "🥦",
      unidadePadrao: "Kg",
      categoria: "Verduras",
      preco: 15.0,
    },
    {
      cdProduto: 8,
      nome: "Melancia",
      icone: "🍉",
      unidadePadrao: "Kg",
      categoria: "Frutas",
      preco: 2.5,
    },
  ];

  return NextResponse.json(produtos);
}
