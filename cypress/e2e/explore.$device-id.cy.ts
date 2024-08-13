describe("Explore Device Detail Page", () => {
  const deviceId = "60f077874fb91e001c71b3b1";

  beforeEach(() => {
    cy.visit(`/explore/${deviceId}`);
  });

  it("should display the device detail box", () => {
    cy.get("#deviceDetailBox").should("be.visible");
  });

  it("should display the device name in the detail box", () => {
    cy.get("#deviceDetailBoxTop").contains("K4N_Senden").should("be.visible");
  });

  it("should show the general information of the device", () => {
    cy.get("#deviceDetailBox").contains("General").click();
    cy.get("#deviceDetailBox").contains("Not specified").should("be.visible");
  });

  it("should list the sensors associated with the device", () => {
    // Step 1: Fetch the sensor data from the API
    cy.request(`https://api.opensensemap.org/boxes/${deviceId}`).then(
      (response) => {
        const sensors = response.body.sensors;

        // Step 2: Extract the sensor titles
        const sensorTitles = sensors.map((sensor: any) => sensor.title);

        // Step 3: Visit the explore page
        cy.visit(`/explore/${deviceId}`);

        // Step 4: Open the Sensors section
        cy.get("#deviceDetailBox").contains("Sensors").click();

        // Step 5: Validate that each sensor title is present on the page
        sensorTitles.forEach((title: string) => {
          cy.get("#deviceDetailBox").contains(title);
        });
      },
    );
  });

  it("should allow selecting the first sensor and display its data in the graph", () => {
    // Step 1: Fetch the sensor data from the API
    cy.request(`https://api.opensensemap.org/boxes/${deviceId}`).then(
      (response) => {
        const sensors = response.body.sensors;

        // Step 2: Extract the title and ID of the first sensor
        const firstSensorTitle = sensors[0].title;
        const firstSensorId = sensors[0]._id;

        // Step 3: Visit the explore page
        cy.visit(`/explore/${deviceId}`);

        // Step 4: Open the Sensors section
        cy.get("#deviceDetailBox").contains("Sensors").click();

        // Step 5: Check the first sensor and validate it is selected
        cy.get(`input[id="${firstSensorId}"]`, { timeout: 10000 })
          .scrollIntoView() // Ensure the element is scrolled into view
          .should("exist") // Confirm the element exists
          .check({ force: true }) // Check the sensor
          .should("be.checked");

        // Verify the corresponding sensor title is displayed on the page
        cy.get("#deviceDetailBox").contains(firstSensorTitle);

        // Step 6: Verify that the graph component appears after the sensor is selected
        cy.get("#graphTop").should("be.visible"); // Wait for the graph to appear
      },
    );
  });

  it("should allow dragging the device detail box", () => {
    // Target the top handle of the device detail box for dragging
    cy.get("#deviceDetailBoxTop").then((handle) => {
      // Trigger drag events on the handle
      cy.wrap(handle)
        .trigger("mousedown", { which: 1, pageX: 0, pageY: 0 }) // Start the drag
        .trigger("mousemove", { clientX: 600, clientY: 100 }) // Move to a new position
        .trigger("mouseup"); // Release the drag

      // Check if the first child of the detailBox has been moved
      cy.get("#componentToMove")
        .should("have.css", "transform")
        .and("not.eq", "none");
    });
  });

  it("should display the share dialog when clicking the share icon", () => {
    cy.get(".lucide-share2").click();
    cy.get('[role="alertdialog"]').contains("Share this link");
  });

  it("should navigate back to the explore page when clicking the close icon", () => {
    cy.get(".lucide-x").click();
    cy.url().should("not.include", deviceId);
  });
});
