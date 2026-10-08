import assert from "node:assert/strict";
import test from "node:test";
import { getPageMetadata } from "../client/src/lib/page-metadata";

test("main user pages have their own French title and description", () => {
  assert.equal(getPageMetadata("/").title, "Accueil");
  assert.equal(getPageMetadata("/team").title, "Partager");
  assert.equal(getPageMetadata("/tasks").title, "Inviter");
  assert.equal(getPageMetadata("/withdrawal").title, "Retrait");

  for (const path of ["/", "/team", "/tasks", "/withdrawal"]) {
    assert.ok(getPageMetadata(path).description.length > 0);
  }
});

test("metadata handles product details, admin routes, and query strings", () => {
  assert.equal(getPageMetadata("/products/12?from=home").title, "Détail du produit");
  assert.equal(getPageMetadata("/mgmt-1np5g23g12/users").title, "Administration");
  assert.equal(getPageMetadata("/history?tab=deposits").title, "Historique du solde");
});
