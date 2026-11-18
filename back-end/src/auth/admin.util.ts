export const ADMIN_ROLE = 'ADMIN';
export const USER_ROLE = 'USER';

/**
 * E-mail do administrador, definido somente no .env (ADMIN_EMAIL).
 * Ele nunca é gravado na tabela `usuario`: a conta admin existe apenas por
 * configuração, então nenhum usuário comum consegue "virar" admin.
 */
export function getAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
}

export function isAdminEmail(email?: string | null): boolean {
  const adminEmail = getAdminEmail();

  return (
    adminEmail !== '' &&
    typeof email === 'string' &&
    email.trim().toLowerCase() === adminEmail
  );
}
