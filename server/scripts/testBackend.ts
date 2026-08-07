import "dotenv/config";

interface ApiResult {
  response: Response;
  body: any;
}

const API_URL = "http://localhost:5000/api";

async function request(
  path: string,
  options: RequestInit = {}
): Promise<ApiResult> {
  const response = await fetch(`${API_URL}${path}`, options);
  const text = await response.text();

  let body: any = {};

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }

  return {
    response,
    body,
  };
}

function expectStatus(
  result: ApiResult,
  expectedStatus: number,
  testName: string
) {
  if (result.response.status !== expectedStatus) {
    throw new Error(
      `${testName} failed. Expected ${expectedStatus}, received ${
        result.response.status
      }. Response: ${JSON.stringify(result.body)}`
    );
  }

  console.log(`PASS: ${testName}`);
}

async function login(
  email: string,
  password: string,
  expectedRole: string
) {
  const result = await request("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  expectStatus(result, 200, `${expectedRole} login`);

  const token = result.body.data?.token;
  const role = result.body.data?.user?.role;

  if (!token) {
    throw new Error(`${expectedRole} login did not return a token.`);
  }

  if (role !== expectedRole) {
    throw new Error(
      `Expected role ${expectedRole}, received ${role}.`
    );
  }

  return token as string;
}

function authenticatedHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL
    ?.trim()
    .toLowerCase();

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  const cashierEmail = process.env.SEED_CASHIER_EMAIL
    ?.trim()
    .toLowerCase();

  const cashierPassword = process.env.SEED_CASHIER_PASSWORD;

  if (
    !adminEmail ||
    !adminPassword ||
    !cashierEmail ||
    !cashierPassword
  ) {
    throw new Error(
      "Admin or Cashier credentials are missing from server/.env."
    );
  }

  console.log("----------------------------------------");
  console.log("Starting Supermarket POS backend tests");
  console.log("----------------------------------------");

  // No token should be rejected
  const unauthorizedProducts = await request("/products");

  expectStatus(
    unauthorizedProducts,
    401,
    "Products reject unauthenticated users"
  );

  // Admin authentication
  const adminToken = await login(
    adminEmail,
    adminPassword,
    "ADMIN"
  );

  const adminHeaders = authenticatedHeaders(adminToken);

  const currentAdmin = await request("/auth/me", {
    headers: adminHeaders,
  });

  expectStatus(currentAdmin, 200, "Admin current-user endpoint");

  // Product reading
  const products = await request("/products", {
    headers: adminHeaders,
  });

  expectStatus(products, 200, "Admin product listing");

  const productSearch = await request(
    "/products?search=milk",
    {
      headers: adminHeaders,
    }
  );

  expectStatus(productSearch, 200, "Product search");

  const barcodeProduct = await request(
    "/products/barcode/100000000001",
    {
      headers: adminHeaders,
    }
  );

  expectStatus(barcodeProduct, 200, "Barcode lookup");

  const categories = await request("/categories", {
    headers: adminHeaders,
  });

  expectStatus(categories, 200, "Category listing");

  const categoryId = categories.body.data?.[0]?.id;

  if (!categoryId) {
    throw new Error(
      "No category was available for product testing."
    );
  }

  // Cashier authentication
  const cashierToken = await login(
    cashierEmail,
    cashierPassword,
    "CASHIER"
  );

  const cashierHeaders = authenticatedHeaders(cashierToken);

  const cashierProducts = await request("/products", {
    headers: cashierHeaders,
  });

  expectStatus(
    cashierProducts,
    200,
    "Cashier can view products"
  );

  // Use duplicate details so no product is created if
  // authorization is accidentally missing
  const cashierCreateAttempt = await request("/products", {
    method: "POST",
    headers: {
      ...cashierHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      barcode: "100000000001",
      sku: "BEV-001",
      name: "Blocked Cashier Product",
      costPrice: 100,
      sellingPrice: 150,
      stockQuantity: 10,
      reorderLevel: 2,
      unit: "ITEM",
      categoryId,
    }),
  });

  expectStatus(
    cashierCreateAttempt,
    403,
    "Cashier cannot create products"
  );

  const cashierUpdateAttempt = await request(
    "/products/999999999",
    {
      method: "PUT",
      headers: {
        ...cashierHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Blocked Update",
      }),
    }
  );

  expectStatus(
    cashierUpdateAttempt,
    403,
    "Cashier cannot update products"
  );

  const cashierDeactivateAttempt = await request(
    "/products/999999999/deactivate",
    {
      method: "PATCH",
      headers: cashierHeaders,
    }
  );

  expectStatus(
    cashierDeactivateAttempt,
    403,
    "Cashier cannot deactivate products"
  );

  // Admin product management
  const uniqueValue = Date.now().toString();

  const testProduct = {
    barcode: `TEST-${uniqueValue}`,
    sku: `TEST-${uniqueValue}`,
    name: "Automated Test Product",
    description: "Temporary product created by backend test",
    costPrice: 100,
    sellingPrice: 150,
    stockQuantity: 10,
    reorderLevel: 2,
    unit: "ITEM",
    categoryId,
  };

  const adminCreate = await request("/products", {
    method: "POST",
    headers: {
      ...adminHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(testProduct),
  });

  expectStatus(adminCreate, 201, "Admin creates product");

  const testProductId = adminCreate.body.data?.id;

  if (!testProductId) {
    throw new Error(
      "Product creation did not return a product ID."
    );
  }

  const adminUpdate = await request(
    `/products/${testProductId}`,
    {
      method: "PUT",
      headers: {
        ...adminHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sellingPrice: 175,
        stockQuantity: 20,
      }),
    }
  );

  expectStatus(adminUpdate, 200, "Admin updates product");

  const adminDeactivate = await request(
    `/products/${testProductId}/deactivate`,
    {
      method: "PATCH",
      headers: adminHeaders,
    }
  );

  expectStatus(
    adminDeactivate,
    200,
    "Admin deactivates product"
  );

  console.log("----------------------------------------");
  console.log("ALL BACKEND TESTS PASSED");
  console.log("----------------------------------------");
}

main().catch((error) => {
  console.error("----------------------------------------");
  console.error("BACKEND TEST FAILED");
  console.error(error.message);
  console.error("----------------------------------------");

  process.exitCode = 1;
});