export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  ok: boolean;
  error?: string;
}

export interface EmailProvider {
  send(input: SendEmailInput): Promise<SendEmailResult>;
}
