import {
  digitsOnly,
  maskCep,
  maskDocument,
  maskPhone,
} from "./masks";

describe("digitsOnly", () => {
  it("mantém apenas os números", () => {
    expect(digitsOnly("(11) 99999-9999")).toBe("11999999999");
    expect(digitsOnly("abc")).toBe("");
  });
});

describe("maskPhone", () => {
  it.each([
    ["1", "1"],
    ["11", "11"],
    ["119", "(11) 9"],
    ["11999", "(11) 999"],
    ["119999", "(11) 9999"],
    ["1199999", "(11) 99999"],
    ["11999998", "(11) 99999-8"],
    ["11999999999", "(11) 99999-9999"],
    ["1199999999999", "(11) 99999-9999"],
  ])("formata %p como %p", (input, expected) => {
    expect(maskPhone(input)).toBe(expected);
  });

  it("aceita texto já mascarado", () => {
    expect(maskPhone("(11) 99999-9999")).toBe("(11) 99999-9999");
  });
});

describe("maskDocument", () => {
  it("formata CPF", () => {
    expect(maskDocument("12345678901", "CPF")).toBe("123.456.789-01");
    expect(maskDocument("1234", "CPF")).toBe("123.4");
  });

  it("limita o CPF a 11 dígitos", () => {
    expect(maskDocument("123456789012345", "CPF")).toBe("123.456.789-01");
  });

  it("formata CNPJ", () => {
    expect(maskDocument("12345678000199", "CNPJ")).toBe("12.345.678/0001-99");
    expect(maskDocument("12345", "CNPJ")).toBe("12.345");
  });

  it("limita o CNPJ a 14 dígitos", () => {
    expect(maskDocument("1234567800019999", "CNPJ")).toBe("12.345.678/0001-99");
  });

  it("devolve vazio quando não há dígitos", () => {
    expect(maskDocument("", "CPF")).toBe("");
  });
});

describe("maskCep", () => {
  it.each([
    ["1234", "1234"],
    ["12345", "12345"],
    ["123456", "12345-6"],
    ["12345678", "12345-678"],
    ["123456789", "12345-678"],
  ])("formata %p como %p", (input, expected) => {
    expect(maskCep(input)).toBe(expected);
  });
});
