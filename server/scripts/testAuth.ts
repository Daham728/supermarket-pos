import "dotenv/config";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  errors?: unknown;
  data?: {
    token: string;
    expiresIn: string;
    user: AuthUser;
  };
}

interface CurrentUserResponse {
  success: boolean;
  message?: string;
  data?: {
    user: AuthUser;
  };
}

const API_URL = "http://localhost:5000/api";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL
    ?.trim()
    .toLowerCase();

  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email) {
    throw new Error(
      "SEED_ADMIN_EMAIL is missing from server/.env"
    );
  }

  if (!password) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is missing from server/.env"
    );
  }

  console.log("Testing Admin authentication...");
  console.log("Credentials loaded securely from server/.env");

  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const loginResult =
    (await loginResponse.json()) as LoginResponse;

  if (!loginResponse.ok || !loginResult.data?.token) {
    console.error("Admin login failed.");
    console.error("Status:", loginResponse.status);
    console.error("Message:", loginResult.message);

    if (loginResult.errors) {
      console.error("Validation errors:", loginResult.errors);
    }

    process.exitCode = 1;
    return;
  }

  console.log("Admin login passed.");
  console.log("User:", {
    id: loginResult.data.user.id,
    name: loginResult.data.user.name,
    email: loginResult.data.user.email,
    role: loginResult.data.user.role,
  });

  const token = loginResult.data.token;

  const currentUserResponse = await fetch(
    `${API_URL}/auth/me`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const currentUserResult =
    (await currentUserResponse.json()) as CurrentUserResponse;

  if (!currentUserResponse.ok) {
    console.error("Current-user test failed.");
    console.error("Status:", currentUserResponse.status);
    console.error("Message:", currentUserResult.message);

    process.exitCode = 1;
    return;
  }

  console.log("Current-user test passed.");
  console.log("Authenticated role:", currentUserResult.data?.user.role);

  const productsResponse = await fetch(
    `${API_URL}/products`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!productsResponse.ok) {
    const productError = await productsResponse.json();

    console.error("Protected Products API test failed.");
    console.error("Status:", productsResponse.status);
    console.error(productError);

    process.exitCode = 1;
    return;
  }

  const productsResult = await productsResponse.json();

  console.log("Protected Products API test passed.");
  console.log(
    "Products returned:",
    productsResult.data?.length ?? 0
  );

  console.log("----------------------------------------");
  console.log("All Admin authentication tests passed.");
  console.log("----------------------------------------");
}

main().catch((error) => {
  console.error("Authentication test crashed:", error.message);
  process.exitCode = 1;
});