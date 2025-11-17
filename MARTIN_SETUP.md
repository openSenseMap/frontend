# Martin Tile Server Setup

Martin tile server serves vector tiles from PostGIS database views.

## Overview

Martin automatically discovers tables and views with geometry columns (SRID 4326) and serves them as Mapbox Vector Tiles.

## Local Setup

### 1. Docker Configuration

Martin is configured in `docker-compose.yml`:
- Runs on port `3001` (host) mapped to port `3000` (container)
- Connects to the `opensensemap` database
- Waits for Postgres to be healthy before starting

### 2. Environment Variables

Optional `.env` variable:
```bash
MARTIN_URL=http://localhost:3001
```

Defaults to `http://localhost:3001` if not set.

### 3. Database View

The `analysis_view` materialized view (created by migration `drizzle/0023_create_analysis_view.sql`) is automatically discovered by Martin.

The view includes:
- `createdAt`, `boxId`, `tags`
- `geometry` (PostGIS Point, SRID 4326)
- Sensor data columns (temperature, humidity, PM values, etc.)

## Usage

### Endpoints

- **Catalog**: `http://localhost:3001/catalog` - Lists all available tile sources
- **TileJSON**: `http://localhost:3001/analysis_view` - Metadata for the tile source
- **Tiles**: `http://localhost:3001/analysis_view/{z}/{x}/{y}.pbf` - Vector tile data

### Starting Services

1. Start Docker services:
   ```bash
   docker-compose up -d
   ```

2. Ensure PostGIS is enabled:
   ```bash
   docker exec frontend-postgres-1 psql -U postgres -d opensensemap -c "CREATE EXTENSION IF NOT EXISTS postgis CASCADE;"
   ```

3. Run migrations:
   ```bash
   npx tsx ./db/migrate.ts
   ```

4. Verify Martin is running:
   ```bash
   curl http://localhost:3001/catalog
   ```

### Adding Data

Use `/api/boxes/{deviceId}/{sensorId}` to add measurements with optional location:

```bash
curl -X POST http://localhost:3000/api/boxes/test-device-001/test-sensor-001 \
  -H "Content-Type: application/json" \
  -d '{
    "value": 21.4,
    "createdAt": "2025-11-06T16:00:00Z",
    "location": { "lat": 52.5200, "lng": 13.4050 }
  }'
```

### Refreshing the View

Refresh the materialized view to include new data:

```bash
docker exec frontend-postgres-1 psql -U postgres -d opensensemap -c "REFRESH MATERIALIZED VIEW CONCURRENTLY analysis_view;"
```
