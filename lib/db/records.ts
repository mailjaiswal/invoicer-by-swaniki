import { db, DataError, now } from "./database";
import { uid } from "@/lib/utils";
import type { Customer, CustomerDraft, Product, ProductDraft } from "@/lib/types";

export async function listCustomers(): Promise<Customer[]> {
  return db.customers.orderBy("name").toArray();
}

export async function listProducts(): Promise<Product[]> {
  return db.products.orderBy("name").toArray();
}

export async function findByCustomerName(
  name: string
): Promise<Customer | undefined> {
  const needle = name.trim().toLowerCase();
  if (!needle) return undefined;
  const all = await db.customers.toArray();
  return all.find((customer) => customer.name.toLowerCase() === needle);
}

/**
 * Insert or update a customer, deduplicating on exact (case-insensitive) name.
 */
export async function upsertCustomer(
  draft: CustomerDraft,
  existingId?: string | null
): Promise<Customer> {
  const name = draft.name.trim();
  if (!name) throw new DataError("Customer name is required.");

  const existing = existingId
    ? await db.customers.get(existingId)
    : await findByCustomerName(name);
  const timestamp = now();

  if (existing) {
    const record: Customer = {
      ...existing,
      ...draft,
      name,
      id: existing.id,
      updatedAt: timestamp,
    };
    await db.customers.put(record);
    return record;
  }

  const record: Customer = {
    id: uid("cus"),
    ...draft,
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await db.customers.put(record);
  return record;
}

export async function findByProductName(
  name: string
): Promise<Product | undefined> {
  const needle = name.trim().toLowerCase();
  if (!needle) return undefined;
  const all = await db.products.toArray();
  return all.find((product) => product.name.toLowerCase() === needle);
}

export async function upsertProduct(
  draft: ProductDraft
): Promise<Product> {
  const name = draft.name.trim();
  if (!name) throw new DataError("Product name is required.");

  const existing = await findByProductName(name);
  const timestamp = now();

  if (existing) {
    const record: Product = {
      ...existing,
      ...draft,
      name,
      id: existing.id,
      updatedAt: timestamp,
    };
    await db.products.put(record);
    return record;
  }

  const record: Product = {
    id: uid("prd"),
    ...draft,
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await db.products.put(record);
  return record;
}

export async function deleteCustomer(id: string): Promise<void> {
  await db.customers.delete(id);
}

export async function deleteProduct(id: string): Promise<void> {
  await db.products.delete(id);
}