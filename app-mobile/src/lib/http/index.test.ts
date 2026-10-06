import { getApiClient } from "./index";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe("getApiClient", () => {
  it("devolve sempre a mesma instância (Singleton)", () => {
    expect(getApiClient()).toBe(getApiClient());
  });
});
