#### Example initial `i18next-node-mongo-backend` with `client` option

## Requirements

- MongoDB
  > Note: The database must not be password protected. If you require it, please modify app.js accordingly.

## Usage

- Ensure values in `.env` are correct
- To get needed modules, run: `npm install`
- From root project, run: `node connect-with-mongoclient/app.js`

## Important

In this example we are implementing the concept of _graceful shutdown_. So it takes about **0-15 seconds** to turn off the server that is running.
