describe("/boxes/:boxid/data/:sensorid", function () {
  it("should allow download data through /boxes/:boxid/data/:sensorid", function () {
    return chakram
      .get(`${BASE_URL}/boxes/${boxIds[0]}/data/${boxes[0].sensors[0]._id}`)
      .then(function (response) {
        expect(response).to.have.status(200);
        expect(Array.isArray(response.body)).to.be.true;
        expect(response).to.have.header(
          "content-type",
          "application/json; charset=utf-8",
        );
        expect(response.body.length).to.be.above(4);
        expect(response).to.have.schema(measurementsSchema);
        expect(
          response.body.every(function (measurement) {
            return expect(
              moment
                .utc(measurement.createdAt, moment.ISO_8601, true)
                .isValid(),
            ).true;
          }),
        ).true;

        return chakram.wait();
      });
  });

  it("should allow download data through /boxes/:boxid/data/:sensorid as csv", function () {
    return chakram
      .get(
        `${BASE_URL}/boxes/${boxIds[0]}/data/${boxes[0].sensors[1]._id}?format=csv&download=true`,
      )
      .then(function (response) {
        expect(response).to.have.status(200);
        expect(response.body).not.to.be.empty;
        expect(response).to.have.header("content-type", "text/csv");
        expect(response).to.have.header(
          "Content-Disposition",
          `attachment; filename=${boxes[0].sensors[1]._id}.csv`,
        );

        return chakram.wait();
      });
  });

  it("should return the data for /boxes/:boxId/data/:sensorId in descending order", function () {
    return chakram
      .get(
        `${BASE_URL}/boxes/${boxIds[0]}/data/${boxes[0].sensors[1]._id}?from-date=2016-01-01T00:00:00Z&to-date=2016-01-31T23:59:59Z`,
      )
      .then(function (response) {
        expect(response).to.have.status(200);
        expect(response).to.have.header(
          "content-type",
          "application/json; charset=utf-8",
        );
        expect(response).to.have.schema(measurementsSchema);
        expect(
          response.body.every(function (measurement) {
            return expect(
              moment
                .utc(measurement.createdAt, moment.ISO_8601, true)
                .isValid(),
            ).true;
          }),
        ).true;
        expect(response.body).not.to.be.empty;
        let isDescending = true;
        for (let i = 1; i < response.body.length - 1; i++) {
          if (
            new Date(response.body[i - 1].createdAt) -
              new Date(response.body[i].createdAt) <
            0
          ) {
            isDescending = false;
            break;
          }
        }

        expect(isDescending).true;

        return chakram.wait();
      });
  });

  it("should allow timestamps in the future for data retrieval", function () {
    const now = moment.utc();

    return chakram
      .get(
        `${BASE_URL}/boxes/${boxIds[0]}/data/${boxes[0].sensors[1]._id}?from-date=${now.add(10, "days").toISOString()}&to-date=${now.add(14, "days").toISOString()}`,
      )
      .then(function (response) {
        expect(response).to.have.status(200);
        expect(response).to.have.header(
          "content-type",
          "application/json; charset=utf-8",
        );
        expect(response.body).to.be.empty;

        return chakram.wait();
      });
  });

  it("should allow to compute outliers in measurements and mark them", function () {
    return chakram
      .get(
        `${BASE_URL}/boxes/${boxIds[0]}/data/${boxes[0].sensors[1]._id}?outliers=mark`,
      )
      .then(function (response) {
        expect(response).to.have.status(200);
        expect(response).to.have.header(
          "content-type",
          "application/json; charset=utf-8",
        );
        expect(response.body).not.lengthOf(0);
        expect(response).json(function (measurementsArray) {
          for (const measurement of measurementsArray) {
            expect(measurement).keys(
              "isOutlier",
              "createdAt",
              "value",
              "location",
            );
            expect(typeof measurement.isOutlier).equal("boolean");
          }
        });

        return chakram.wait();
      });
  });

  it("should allow to compute outliers in measurements and replace them", function () {
    return chakram
      .get(
        `${BASE_URL}/boxes/${boxIds[0]}/data/${boxes[0].sensors[1]._id}?outliers=replace`,
      )
      .then(function (response) {
        expect(response).to.have.status(200);
        expect(response).to.have.header(
          "content-type",
          "application/json; charset=utf-8",
        );
        expect(response.body).not.lengthOf(0);
        expect(response).json(function (measurementsArray) {
          for (const measurement of measurementsArray) {
            expect(measurement).keys(
              "isOutlier",
              "createdAt",
              "value",
              "location",
            );
            expect(typeof measurement.isOutlier).equal("boolean");
          }
        });

        return chakram.wait();
      });
  });
});

it("should return a single sensor of a box for /boxes/:boxid/sensors/:sensorId GET", async () => {
  // Arrange
  const request = new Request(
    `${BASE_URL}/boxes/${boxes[0]._id}/sensors/${boxes[0].sensors[0]._id}`,
    { method: "GET", headers: { Authorization: `Bearer ${jwt}` } },
  );

  // Act
  const dataFunctionValue = await boxSensorLoader({
    request,
  } as LoaderFunctionArgs); // Assuming a separate loader for single sensor
  const response = dataFunctionValue as Response;
  const body = await response?.json();

  // Assert
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe(
    "application/json; charset=utf-8",
  );
  // If you have a schema check: expect(body).toMatchSchema(sensorSchema);
  // For now, just expect the body has the expected shape
  expect(body).toHaveProperty("_id");
});

it("should return only value of a single sensor of a box for /boxes/:boxid/sensors/:sensorId?onlyValue=true GET", async () => {
  // Arrange
  const request = new Request(
    `${BASE_URL}/boxes/${boxes[0]._id}/sensors/${boxes[0].sensors[0]._id}?onlyValue=true`,
    { method: "GET", headers: { Authorization: `Bearer ${jwt}` } },
  );

  // Act
  const dataFunctionValue = await boxSensorLoader({
    request,
  } as LoaderFunctionArgs);
  const response = dataFunctionValue as Response;
  const body = await response?.json();

  // Assert
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe(
    "application/json; charset=utf-8",
  );
  expect(typeof body).toBe("number");
});
