describe("Landing page tests", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("Visits the Landing Page", () => {
    cy.url().should("include", "/");
  });

  it("Checks the page title", () => {
    cy.title().should("eq", "openSenseMap");
  });

  it("Checks that the Explore button is visible and clickable", () => {
    cy.get("[data-cy='explore-button']").click();
    cy.url().should("include", "/explore");
  });

  it("Checks that the Donate button is visible and has the correct target URL", () => {
    cy.get("[data-cy='donate-button']")
      .should(
        "have.attr",
        "href",
        "https://www.betterplace.org/de/projects/89947-opensensemap-org-die-freie-karte-fuer-umweltdaten",
      )
      .should("have.text", "Donate");
  });

  it("Checks that the header is visible", () => {
    cy.get("header").should("be.visible");
  });

  it("Checks that the Features section is present", () => {
    cy.get("section").contains("Features").should("be.visible");
  });

  it("Checks that the Partners section is present", () => {
    cy.get("section").contains("Partners").should("be.visible");
  });

  it("Checks that the Footer is present", () => {
    cy.get("footer").should("be.visible");
  });
});
