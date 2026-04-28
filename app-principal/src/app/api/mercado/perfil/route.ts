/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        if (!email) return NextResponse.json({ error: "E-mail não fornecido" }, { status: 400 });

        const mercado = await prisma.cliente.findUnique({ where: { email } });
        if (!mercado) return NextResponse.json({ error: "Mercado não encontrado" }, { status: 404 });

        return NextResponse.json(mercado);
    } catch (error) {
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}