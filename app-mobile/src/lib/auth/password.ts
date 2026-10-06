const SPECIAL_CHARACTERS = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export interface PasswordRequirement {
  label: string;
  met: boolean;
}

// Requisitos da senha (mesma regra do site), um por linha para a pessoa ver o que falta.
export function passwordRequirements(password: string): PasswordRequirement[] {
  return [
    { label: "Pelo menos 8 caracteres", met: password.length >= 8 },
    { label: "Uma letra maiúscula (A-Z)", met: /[A-Z]/.test(password) },
    { label: "Uma letra minúscula (a-z)", met: /[a-z]/.test(password) },
    { label: "Um número (0-9)", met: /\d/.test(password) },
    { label: "Um símbolo (! @ # $ %)", met: SPECIAL_CHARACTERS.test(password) },
  ];
}

export function isValidPassword(password: string): boolean {
  return passwordRequirements(password).every((requirement) => requirement.met);
}

const STRENGTH_LABELS = ["Muito fraca", "Fraca", "Razoável", "Forte", "Muito forte"] as const;

export interface PasswordStrength {
  score: number; // 0 a 5, número de barras preenchidas
  label: (typeof STRENGTH_LABELS)[number];
}

export function passwordStrength(password: string): PasswordStrength {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /\d/.test(password),
    SPECIAL_CHARACTERS.test(password),
    password.length >= 12,
  ].filter(Boolean).length;

  return { score, label: STRENGTH_LABELS[Math.max(0, score - 1)] };
}
