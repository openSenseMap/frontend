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
- Scalar columns for common phenomena (e.g. `temperature`, `humidity`, `soil_moisture`, `pressure`, `pm1`, `pm2_5`, `pm4`, `pm10`, `wind_speed`, `light_intensity`, `uv_intensity`, `uv_index`, `sound_level`, `sound_level_eq`, `sound_level_min`, `sound_level_max`, `voc`, `co2`)

**Note**: Martin automatically discovers tables and views with geometry columns that have SRID 4326, ( `analysis_view` in our case).

### 2. Docker Configuration

Martin is configured in `docker-compose.yml`:
- Runs on port `3001` (host) mapped to port `3000` (container)
- Connects to the database specified in your `DATABASE_URL` (defaults to `opensensemap`)
- Uses the same Docker network (`app-network`)
- Waits for Postgres to be healthy before starting

### 3. Local Environment Variables

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

## View Structure

The `analysis_view` groups measurements by time and device, aggregating all sensor measurements into a JSONB object:

```sql
SELECT
    "createdAt",                -- timestamp
    "boxId",                    -- device ID
    tags,                        -- device tags array
    geometry,                    -- PostGIS Point (SRID 4326)
    temperature,
    soil_temperature,
    humidity,
    soil_moisture,
    pressure,
    pm1,
    pm2_5,
    pm4,
    pm10,
    wind_speed,
    light_intensity,
    uv_intensity,
    uv_index,
    sound_level,
    sound_level_eq,
    sound_level_min,
    sound_level_max,
    voc,
    co2
FROM analysis_view;
```


