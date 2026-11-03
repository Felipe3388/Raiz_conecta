import { describe, expect, it } from "vitest";
import { maskCep, maskDocumento, maskUf } from "./mask";

describe("máscaras", () => {
  it("CEP", () => {
    expect(maskCep("")).toBe("");
    expect(maskCep("175")).toBe("175");
    expect(maskCep("17500")).toBe("17500");
    expect(maskCep("175000")).toBe("17500-0");
    expect(maskCep("17500-000abc99")).toBe("17500-000");
  });

  it("CPF", () => {
    expect(maskDocumento("CPF", "123")).toBe("123");
    expect(maskDocumento("CPF", "1234")).toBe("123.4");
    expect(maskDocumento("CPF", "1234567")).toBe("123.456.7");
    expect(maskDocumento("CPF", "12345678901")).toBe("123.456.789-01");
    expect(maskDocumento("CPF", "123.456.789-0199999")).toBe("123.456.789-01");
  });

  it("CNPJ", () => {
    expect(maskDocumento("CNPJ", "12")).toBe("12");
    expect(maskDocumento("CNPJ", "12345")).toBe("12.345");
    expect(maskDocumento("CNPJ", "12345678")).toBe("12.345.678");
    expect(maskDocumento("CNPJ", "12345678000199")).toBe("12.345.678/0001-99");
    expect(maskDocumento("CNPJ", "12345678000199999")).toBe("12.345.678/0001-99");
  });

  it("UF", () => {
    expect(maskUf("sp")).toBe("SP");
    expect(maskUf("s1p2x")).toBe("SP");
  });
});
