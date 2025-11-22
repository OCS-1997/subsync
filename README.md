# Subsync
Effortlessly manage customers, services, subscriptions and renewals.

## Overview
Subsync is a web-based subscription and renewal management system that helps companies track customers, services and their subscriptions in one place. It centralizes customer and vendor data, service catalog, subscriptions, taxes and renewal dates, and is designed to support automated reminder workflows with minimal manual effort.

This repository contains the web application version of Subsync, including a React frontend, Node.js/Express API and MySQL database schema. (A separate desktop application may exist, but it is not part of this repository.)

## Features
* Customer and vendor management (contact details, addresses, tax preferences, payment terms and notes).
* Service catalog with item groups, tax rates and pricing details.
* Subscription management with support for renewal dates, recurring periods, discounts, taxes and totals.
* Domain management linked to customers, including nameservers and providers.
* CSV import/export for customers and other data flows.
* Activity logging and subscription history tracking.
* Designed to support automated reminder and alert workflows based on subscription status.

## Architecture
Subsync is implemented as a three-tier web application:

* **Frontend**: React 18 + Vite app in `web-app/subsync`, built and served via Nginx in Docker.
* **Backend API**: Node.js 18 + Express server in `web-app/server`, exposing a REST API under `/api`.
* **Database**: MySQL 8, with schema and seed data defined in `web-app/server/db/subsync.sql`.

Docker Compose is provided to orchestrate all three services (database, backend and frontend) for local development or deployment.

## Repository structure
* `docker-compose.yml` – Orchestrates MySQL, backend API and frontend.
* `.env.example` – Example environment configuration for Docker-based development (DB and JWT settings).
* `web-app/server` – Express API, business logic, controllers, models and SQL schema.
  * `Dockerfile` – Development Docker image for the backend API.
  * `db/subsync.sql` – Database schema and seed data for MySQL.
* `web-app/subsync` – React + Vite frontend.
  * `Dockerfile` – Build-and-serve image for the frontend (builds static assets then serves via Nginx).
  * `.env.example` – Example Vite environment variables (API URL, JWT expiry, etc.).

## Prerequisites
To run the full system you will typically need:

* Node.js 18+ and npm
* Docker and Docker Compose (recommended for easiest setup)
* MySQL 8 (only required directly if you are not using Docker for the database)

## Configuration
### Root environment (.env)
Copy the example file at the project root:

1. Duplicate `.env.example` as `.env`.
2. Fill in the values:
   * `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` – Database connection for MySQL.
   * `JWT_SECRET` – Secret key used to sign JWT tokens on the backend.
   * `CLIENT_PORT` – Port for the Vite dev server (default `5173`).
   * `NODE_PORT` – Port for the Node/Express API (default `3000`).

Docker Compose will automatically load these values and inject them into the containers.

### Frontend environment (Vite)
For local frontend development (without Docker):

1. Go to `web-app/subsync`.
2. Duplicate `.env.example` as `.env`.
3. Set at minimum:
   * `VITE_API_URL` – Base URL for the backend API, e.g. `http://localhost:3000/api`.
   * `VITE_JWT_EXPIRY` – JWT expiry in seconds.

### Backend environment (local development)
When running the backend without Docker, configure the same variables shown in `.env.example`, either as shell environment variables or in a `.env` file under `web-app/server` (using the same keys: `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `JWT_SECRET`, `CLIENT_PORT`, `NODE_PORT`).

## Running with Docker Compose (recommended)
1. Ensure Docker and Docker Compose are installed and running.
2. From the project root, create and configure `.env` as described above.
3. Start all services:
   * `docker compose up -d --build`
4. Once the containers are healthy:
   * Frontend will be available at `http://localhost` (Nginx container on port 80).
   * Backend API will be available at `http://localhost:3000` (inside the Docker network as service `backend`, exposed on host port 3000).
   * MySQL will be available on host port `3307` (mapped to container port `3306`).

The database schema is automatically initialized from `web-app/server/db/subsync.sql` when the `db` container is first created.

To stop the stack:
* `docker compose down`

## Running locally without Docker
You can also run the backend and frontend directly on your machine.

### 1. Set up the database
1. Install MySQL 8 (or connect to an existing instance).
2. Create the database and schema using `web-app/server/db/subsync.sql`. For example:
   * `mysql -u <user> -p < web-app/server/db/subsync.sql`
3. Ensure the credentials in your backend `.env` (`DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`) match your MySQL instance.

### 2. Start the backend API
1. Navigate to `web-app/server`.
2. Install dependencies:
   * `npm install`
3. Configure environment variables (either via shell or a `.env` file as noted above).
4. Run the development server:
   * `npm run dev`
5. The API will listen on `http://localhost:3000` (or the port set in `NODE_PORT`).

### 3. Start the frontend
1. Navigate to `web-app/subsync`.
2. Install dependencies:
   * `npm install`
3. Ensure `VITE_API_URL` in `.env` points to your running backend, e.g. `http://localhost:3000/api`.
4. Start the Vite dev server:
   * `npm run dev`
5. Open the app in your browser at `http://localhost:5173` (or the port configured in `CLIENT_PORT`).

## Available scripts
### Frontend (`web-app/subsync`)
* `npm run dev` – Start the Vite development server.
* `npm run build` – Build the production-ready frontend bundle.
* `npm run lint` – Run ESLint on the frontend codebase.
* `npm run preview` – Preview the built frontend locally.

### Backend (`web-app/server`)
* `npm run dev` – Start the Express API with `nodemon` for automatic reload on changes.

## Notes
* The backend exposes a REST API under the `/api` prefix; authentication is based on JWT tokens.
* Subscription reminder endpoints and history logging are in place so that email/SMS notification workflows can be integrated or scheduled externally as needed.
* For production deployments, you can adapt the provided Dockerfiles and `docker-compose.yml` or use them as a base for your own CI/CD pipeline.
