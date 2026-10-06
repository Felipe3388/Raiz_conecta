import type { ApiClient } from "@/lib/http/ApiClient";
import { appendAttachment } from "@/lib/http/formData";
import type { RegistrationData } from "@/types/registration";
import type { RegistrationGateway } from "./RegistrationGateway";
import { buildRegistrationFields } from "./registrationFields";

export class RegistrationService implements RegistrationGateway {
  constructor(
    private readonly api: Pick<ApiClient, "postForm">,
    private readonly appendFile: typeof appendAttachment = appendAttachment,
  ) {}

  async register(data: RegistrationData): Promise<void> {
    const { attachment } = data.profile;
    if (!attachment) throw new Error("Anexe a foto do seu documento para validação.");

    const form = new FormData();
    for (const [field, value] of Object.entries(buildRegistrationFields(data))) {
      form.append(field, value);
    }
    await this.appendFile(form, "file", attachment);

    await this.api.postForm("/api/auth/cadastro", form);
  }
}
