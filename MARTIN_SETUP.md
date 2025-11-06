# Martin Tile Server Setup

This document explains how to use Martin tile server to serve vector tiles from your PostGIS database.

## Overview

Martin is a tile server that generates and serves vector tiles on the fly from PostGIS databases. It's configured to:
- Run in the same Docker network as your PostGIS database
- Automatically discover tables and views with geometry columns (SRID 4326)
- Serve them as Mapbox Vector Tiles

## Setup

### 1. Database Views

**Analysis View**: A database view `analysis_view` has been created for data analysis. The migration is in `drizzle/0023_create_analysis_view.sql`.

The view provides a denormalized structure with:
- `createdAt`: measurement timestamp
- `boxId`: device ID
- `tags`: device tags array
- `geometry`: location point (SRID 4326)
- `measurements`: JSONB object containing all sensor measurements

**Note**: Martin automatically discovers tables and views with geometry columns that have SRID 4326. The `analysis_view` geometry column is properly configured for Martin.

### 2. Docker Configuration

Martin is configured in `docker-compose.yml`:
- Runs on port `3001` (host) mapped to port `3000` (container)
- Connects to the database specified in your `DATABASE_URL` (defaults to `opensensemap`)
- Uses the same Docker network (`app-network`)
- Waits for Postgres to be healthy before starting

### 3. Environment Variables

Add to your `.env` file (optional):
```bash
MARTIN_URL=http://localhost:3001
```

If not set, it defaults to `http://localhost:3001`.

**Note**: Martin runs on port `3001` to avoid conflicts with the frontend dev server (port `3000`).

**Note**: Martin's `DATABASE_URL` in `docker-compose.yml` should match your application's database name. Currently configured for `opensensemap` database.

## Usage

### Accessing Martin

Martin is accessible directly at `http://localhost:3001` (or your configured `MARTIN_URL`):

- **TileJSON**: `http://localhost:3001/{source_name}`
  - Returns metadata about the tile source
  - Example: `http://localhost:3001/analysis_view`

- **Tiles**: `http://localhost:3001/{source_name}/{z}/{x}/{y}.pbf`
  - Returns vector tile data for a specific tile
  - Example: `http://localhost:3001/analysis_view/10/512/512.pbf`

### Using in React Components

Add Martin vector tiles to your map using the `Source` and `Layer` components from `react-map-gl`:

```tsx
import { Source, Layer } from "react-map-gl";
import { MapProvider } from "react-map-gl";
import Map from "~/components/map/map";

function MyMapWithPoints() {
  const martinUrl = window.ENV?.MARTIN_URL || "http://localhost:3001";
  
  // Construct the tile URL template directly
  // Mapbox GL will replace {z}, {x}, {y} with actual tile coordinates
  const tileUrl = `${martinUrl}/analysis_view/{z}/{x}/{y}.pbf`;

  return (
    <MapProvider>
      <Map>
        <Source id="points-source" type="vector" url={tileUrl}>
          <Layer
            id="points-layer"
            type="circle"
            source-layer="analysis_view"
            paint={{
              "circle-color": "#FF0000",
              "circle-radius": 5,
              "circle-stroke-color": "#FFFFFF",
              "circle-stroke-width": 1,
            }}
          />
        </Source>
      </Map>
    </MapProvider>
  );
}
```

## Starting the Services

1. **Start Docker services**:
   ```bash
   docker-compose up -d
   ```
   This will start both Postgres and Martin. Martin will wait for Postgres to be healthy.

2. **Ensure PostGIS is enabled**:
   ```bash
   docker exec frontend-postgres-1 psql -U postgres -d opensensemap -c "CREATE EXTENSION IF NOT EXISTS postgis CASCADE;"
   ```

3. **Run migrations** (if not already done):
   ```bash
   npx tsx ./db/migrate.ts
   ```
   This will create the `analysis_view` and other database structures.

4. **Verify Martin is running and discovering views**:
   ```bash
   curl http://localhost:3001/catalog
   ```
   Should return JSON with available tile sources in the `tiles` object. You should see `analysis_view` listed if it has data with geometry.
   
   To check if the view is properly configured:
   ```bash
   docker exec frontend-postgres-1 psql -U postgres -d opensensemap -c "SELECT Find_SRID('public', 'analysis_view', 'geometry');"
   ```
   Should return `4326`.

5. **Start the frontend**:
   ```bash
   npm run dev
   ```

## Troubleshooting

### Martin container keeps restarting

- **PostGIS not enabled**: Ensure PostGIS extension is created in your database
  ```bash
  docker exec frontend-postgres-1 psql -U postgres -d opensensemap -c "CREATE EXTENSION IF NOT EXISTS postgis CASCADE;"
  ```
- **Database connection issues**: Check Martin logs for connection errors
  ```bash
  docker-compose logs martin
  ```
- **Wrong database name**: Ensure `DATABASE_URL` in `docker-compose.yml` matches your database name

### Martin not accessible

- Check if Martin container is running: `docker-compose ps`
- Check Martin logs: `docker-compose logs martin`
- Verify database connection in Martin logs

### Tiles not loading / Catalog is empty

- **SRID issue**: Martin requires geometry columns to have SRID 4326 (not 0). Check the view:
  ```bash
  docker exec frontend-postgres-1 psql -U postgres -d opensensemap -c "SELECT Find_SRID('public', 'analysis_view', 'geometry');"
  ```
  Should return `4326`. If it returns `0`, the view needs to be updated to ensure proper SRID casting.
- **No data with geometry**: Martin only discovers views/tables that have at least one row with a non-null geometry. Check if the view has data:
  ```bash
  docker exec frontend-postgres-1 psql -U postgres -d opensensemap -c "SELECT COUNT(*) FROM analysis_view WHERE geometry IS NOT NULL;"
  ```
- Verify the view exists: `docker exec frontend-postgres-1 psql -U postgres -d opensensemap -c "\dv analysis_view"`
- Check Martin catalog: `curl http://localhost:3001/catalog`
- Check browser console for errors
- Verify `MARTIN_URL` environment variable is set correctly
- Check Martin logs for discovery errors: `docker-compose logs martin`

### Port conflicts

If port 3001 is already in use:
- Change Martin's port in `docker-compose.yml`:
  ```yaml
  ports:
    - "3002:3000"  # Use 3002 on host
  ```
- Update `MARTIN_URL` in `.env` to match: `MARTIN_URL=http://localhost:3002`

## Direct Martin Access

Martin is accessible directly and has CORS enabled, so you can use it from your frontend without any proxy:

- **Catalog**: `http://localhost:3001/catalog` - Lists all available tile sources (automatically discovers views/tables with geometry columns)
- **TileJSON**: `http://localhost:3001/analysis_view` - Metadata for the analysis_view source
- **Tiles**: `http://localhost:3001/analysis_view/{z}/{x}/{y}.pbf` - Vector tile data

**Important**: Martin only discovers views/tables that:
- Have geometry columns with SRID 4326
- Contain at least one row with a non-null geometry

Martin automatically handles CORS, so you can use these URLs directly in your Mapbox GL sources.

## View Structure

The `analysis_view` groups measurements by time and device, aggregating all sensor measurements into a JSONB object:

```sql
SELECT 
    "createdAt",      -- timestamp
    "boxId",          -- device ID
    tags,             -- device tags array
    geometry,         -- PostGIS Point (SRID 4326)
    measurements      -- JSONB: { "sensor_name": { "value": ..., "unit": ..., "sensor_id": ... } }
FROM analysis_view;
```

Each sensor measurement in the `measurements` JSONB object contains:
- `value`: The measurement value
- `unit`: The unit of measurement
- `sensor_id`: The sensor ID

