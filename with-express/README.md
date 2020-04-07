# Example integrate `i18next-node-mongo-backend` with `express`

## Requirements

- MongoDB
> Note: May not be password protected. If you still need it, do your own customization directly on the code.

## Usage

From root project:
`node with-express/app.js`

Go to http://127.0.0.1:3000/ to see what happening.
> Note: You can change the default configuration in `.env` file on root project

## Important

In this example we are implementing the concept of _graceful shutdown_. So it takes about **0-10 seconds** to turn off the server that is running.