// lib/api.ts
/**
 * Wrapper para a API fetch que injeta automaticamente o token de autenticação
 * e lida com respostas de erro comuns, como 401 Unauthorized.
 */

// Pega o token do localStorage de forma segura, evitando erros no lado do servidor (SSR)
function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("conexao_trade_token");
}

// Limpa os dados de sessão e redireciona para o login
function handleUnauthorizedAccess(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem("conexao_trade_token");
  localStorage.removeItem("conexao_trade_user");
  // Evita redirecionamentos em loop se a própria página de login causar um 401
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

interface ApiFetchOptions extends RequestInit {
  // Podemos adicionar opções customizadas no futuro se necessário
}

export async function apiFetch(
  url: string,
  options: ApiFetchOptions = {}
): Promise<Response> {
  const token = getToken();

  // Prepara os cabeçalhos
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const finalOptions: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, finalOptions);

  // Se o token for inválido ou expirado, o backend retornará 401.
  // Nesse caso, limpamos a sessão e redirecionamos para o login.
  if (response.status === 401) {
    handleUnauthorizedAccess();
    // Lança um erro para interromper a execução do código que chamou a apiFetch,
    // já que o redirecionamento pode não ser instantâneo.
    throw new Error("Sessão expirada ou inválida. Redirecionando para o login.");
  }

  return response;
}
