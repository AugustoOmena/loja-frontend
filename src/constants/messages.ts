/**
 * Mensagens padronizadas para reuso na aplicação (checkout, validações, erros).
 */

export const messages = {
  /** Títulos e labels genéricos */
  attention: "Atenção",
  paymentErrorTitle: "Erro no pagamento",

  /** Checkout – CEP e frete */
  fillCepToSeeShipping:
    "Preencha o CEP no endereço acima para ver as opções de frete.",
  selectShippingToPay:
    "Selecione uma opção de frete acima para escolher o meio de pagamento.",
  fillCepForFrete: "Preencha o CEP para ver o frete",

  /** Validação – campos obrigatórios */
  cardholderNameRequired: "Nome no cartão é obrigatório.",
  fullNameRequired: "Nome completo é obrigatório.",
  fullNameFirstLast: "Digite nome e sobrenome.",
  firstNameRequired: "Nome é obrigatório.",
  lastNameRequired: "Sobrenome é obrigatório.",
  firstNameMaxLength: "Nome deve ter no máximo 50 caracteres.",
  lastNameMaxLength: "Sobrenome deve ter no máximo 80 caracteres.",
  emailRequired: "E-mail é obrigatório.",
  emailInvalid: "Digite um e-mail válido.",
  cpfRequiredDigits: "CPF deve ter 11 dígitos.",
  cpfInvalid: "CPF inválido. Verifique os números.",
  installmentsRequired: "Selecione o número de parcelas.",
  zipCodeDigits: "CEP deve ter 8 dígitos.",
  zipCodeInvalid: "CEP inválido.",
  streetRequired: "Rua é obrigatória.",
  cityRequired: "Cidade é obrigatória.",

  /** Validação – resumo */
  fixFieldsToContinue: "Corrija os campos destacados antes de continuar.",

  /** Auth / sessão */
  sessionExpired: "Sessão expirada. Faça login novamente.",

  /** Pagamento – erros de API / genéricos */
  paymentDeclined: "Pagamento recusado.",
  paymentProcessingError: "Erro no processamento do pagamento.",
  paymentTryAgain: "Erro no processamento. Tente novamente.",

  /** Pagamento – mensagens durante processamento (ciclo suave no botão) */
  processingPayment: [
    "Estamos processando seu pagamento...",
    "Já é quase seu...",
    "Quase lá...",
  ] as const,
} as const;

export type MessageKey = keyof typeof messages;
