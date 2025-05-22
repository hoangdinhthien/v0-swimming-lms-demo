import config from "./config.json";

export async function login(email: string, password: string) {
  const response = await fetch(`${config.API}/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Đăng nhập thất bại");
  }

  return response.json();
}
