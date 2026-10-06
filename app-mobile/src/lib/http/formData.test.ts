import { appendAttachment } from "./formData";

describe("appendAttachment (celular)", () => {
  it("anexa o arquivo no formato { uri, name, type } aceito pelo React Native", async () => {
    const form = { append: jest.fn() } as unknown as FormData;

    await appendAttachment(form, "file", {
      uri: "file:///doc.jpg",
      name: "doc.jpg",
      mimeType: "image/jpeg",
    });

    expect(form.append).toHaveBeenCalledWith("file", {
      uri: "file:///doc.jpg",
      name: "doc.jpg",
      type: "image/jpeg",
    });
  });
});
