import { isValidEmail } from "./email";

describe("isValidEmail", () => {
  it.each(["ana@sitio.com", "a.b+c@dominio.com.br", " ana@sitio.com "])("aceita %p", (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each(["", "ana", "ana@", "ana@sitio", "ana@sitio.c", "a na@sitio.com", "@sitio.com"])(
    "recusa %p",
    (email) => {
      expect(isValidEmail(email)).toBe(false);
    },
  );
});
