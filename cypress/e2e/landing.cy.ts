import { faker } from "@faker-js/faker";

describe("Landing page tests", () => {
  it("Visits the Landing Page", () => {
    cy.visit("/");
  });
});
