#### Example initial `i18next-node-mongo-backend` with `client` option

## Requirements

- MongoDB
  > Note: The database must not be password. If you still need it, do your own customization directly on the code.

## Usage

From root project:

`node connect-with-mongoclient/app.js`

## Important

In this example we are implementing the concept of _graceful shutdown_. So it takes about **0-15 seconds** to turn off the server that is running.
