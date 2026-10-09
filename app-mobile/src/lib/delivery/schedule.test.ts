import { addDays, dayKey, dayLabel, dayOffset, weekdayLabel } from "./schedule";

// Todas as datas são do fuso do aparelho (meio-dia, para o horário de verão não virar o dia).
const day = (iso: string) => new Date(`${iso}T12:00:00`);

describe("dayKey", () => {
  it("dia no formato AAAA-MM-DD", () => {
    expect(dayKey(day("2026-10-08"))).toBe("2026-10-08");
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});

describe("addDays", () => {
  it("soma dias, virando mês e ano", () => {
    expect(addDays("2026-10-08", 1)).toBe("2026-10-09");
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-10-08", -8)).toBe("2026-09-30");
    expect(addDays("2026-10-08", 0)).toBe("2026-10-08");
  });
});

describe("dayOffset (quantos dias de hoje até o dia)", () => {
  const today = day("2026-10-08");

  it("hoje é 0, amanhã 1, ontem -1", () => {
    expect(dayOffset("2026-10-08", today)).toBe(0);
    expect(dayOffset("2026-10-09", today)).toBe(1);
    expect(dayOffset("2026-10-07", today)).toBe(-1);
  });

  it("não importa a hora de hoje", () => {
    expect(dayOffset("2026-10-09", new Date(2026, 9, 8, 0, 5))).toBe(1);
    expect(dayOffset("2026-10-09", new Date(2026, 9, 8, 23, 55))).toBe(1);
  });

  it("conta certo na virada do mês", () => {
    expect(dayOffset("2026-11-02", day("2026-10-30"))).toBe(3);
  });
});

describe("weekdayLabel", () => {
  it("dia da semana abreviado e data", () => {
    expect(weekdayLabel("2026-10-08")).toBe("qui, 08/10");
    expect(weekdayLabel("2026-10-12")).toBe("seg, 12/10");
    expect(weekdayLabel("2026-10-11")).toBe("dom, 11/10");
  });
});

describe("dayLabel", () => {
  const today = day("2026-10-08");

  it("Hoje, Amanhã e Ontem", () => {
    expect(dayLabel("2026-10-08", today)).toBe("Hoje");
    expect(dayLabel("2026-10-09", today)).toBe("Amanhã");
    expect(dayLabel("2026-10-07", today)).toBe("Ontem");
  });

  it("outros dias mostram a semana e a data", () => {
    expect(dayLabel("2026-10-12", today)).toBe("seg, 12/10");
    expect(dayLabel("2026-10-01", today)).toBe("qui, 01/10");
  });
});
