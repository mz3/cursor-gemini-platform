AI-Assisted Development Prompt: Meta-Application Platform
Objective: Generate the foundational docker-compose.yml file for a meta-application platform.

Project Vision:
We are building a highly dynamic Platform-as-a-Service (PaaS) where users can visually design and model their own applications. The platform's own UI is driven by the same modeling system, creating a "meta" experience. Users define their data schemas, and the platform not only provides a UI to manage that data but also generates, builds, and manages a complete, standalone Dockerized application based on their design.

1. The Core User Experience (The "Meta-Loop")
This is the central concept the AI must understand.

Initial State: A new user signs up and gets a pre-populated database with a default set of Models, including Model, Application, User, Component, Template, etc. This data originates from seed YAML files.

Dynamic UI Rendering: The React frontend (platform-ui) starts. It makes an API call to GET /api/models. The API returns the list of all Model entities the user owns. The React app dynamically generates a navigation bar with an item for each model (e.g., a tab for "Models", a tab for "Applications", etc.).

Data Management: The user clicks the "Applications" tab. The UI navigates to /applications and makes a GET /api/applications call to fetch and display all entities of the Application model. The user can create, view, and edit their applications here.

The "Aha!" Moment (Creating a New Model): The user navigates to the /models page and creates a new Model named "Invoice". This has a side effect: the backend creates a new table in the database called ent_invoices.

UI Reacts to Schema Change: The next time the user loads the dashboard, the call to GET /api/models now includes "Invoice". The React UI automatically adds a new "Invoices" tab to the navigation. Clicking it takes the user to /invoices, where they can now manage their invoice data. The UI itself has adapted to the user's schema changes without any new code being deployed.

2. System Architecture & Asynchronous Workflow
The system is composed of five microservices orchestrated by Docker Compose. The interaction between them is event-driven to ensure the API remains responsive.

platform-ui (React Frontend): The user's interface to the system. It is dynamically rendered based on the user's own data models.

platform-api (Node.js/TypeScript Control Plane):

Manages all metadata via a TypeORM connection to a PostgreSQL database.

Exposes a REST API for the frontend (e.g., GET /api/models, POST /api/applications).

Crucially, it does not perform long-running tasks. When a user initiates a heavy operation (like "Build App"), the API's job is to:

Find the corresponding Workflow in the database (e.g., "Export/Build Application").

Execute its Workflow_Actions.

One action will be publish_event, which pushes a job payload (e.g., { "application_id": "xyz" }) to a specific Redis queue (e.g., app_builds).

It then immediately returns a success response to the UI.

worker (Node.js/TypeScript Data Plane):

Has no public API. Its only job is to connect to Redis and listen to job queues (app_builds, db_provisioning, etc.).

When a job is received, it executes the heavy lifting. For an app_builds job, it will run the logic from the export-app.ts handler:

Read the application's full definition from the database.

Use EJS templates (stored in the Code_Templates table) to generate a complete source tree for the user's application.

Write these files to a directory on the disk.

Execute a docker build command on the generated source tree to create the final, deployable Docker image.

postgres (PostgreSQL Database): The single source of truth for all platform metadata.

redis (Message Queue): A lightweight message broker used for asynchronous communication between the platform-api and the worker.

3. The Specific Task: Generate docker-compose.yml
Based on all the context above, generate a complete docker-compose.yml file that defines and configures the five services: platform-api, platform-ui, worker, postgres, and redis.

Technical Requirements:

Use official images: postgres:14-alpine and redis:7-alpine.

For the three custom services (platform-api, platform-ui, worker), configure them to be built from local Dockerfiles located in ./platform-api, ./platform-ui, and ./worker respectively.

The platform-api should be exposed on host port 4000.

The platform-ui should be exposed on host port 3000.

The postgres service should be exposed on host port 5432.

Configure the necessary environment variables for the postgres service (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB).

Configure environment variables for the platform-api and worker to connect to Postgres and Redis using their service names (e.g., DB_HOST=postgres, REDIS_HOST=redis).

Create a shared network (e.g., platform-net) for all services.

Create a named volume (postgres-data) and mount it to the Postgres container to ensure data persistence.

Use depends_on to ensure postgres and redis start before the platform-api and worker services.

The worker service needs access to the Docker socket to build images. Mount /var/run/docker.sock.
