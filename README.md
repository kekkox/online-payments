# Online-payments

REST API to manage online payments made with Typescript, express and mongoose.

## How to run the project

### On docker

First of all, you need to create an .env file that contains all the required env variables (See .env.sample file for more details).

Now you have to choose if you want to lunch the project in development mode or in production mode

**Development mode**

Just run the command:

```sh
npm run docker-up:dev
```

The images will be build and the project will be started in development mode on the container.
Any changes will be automatically applied on the container thanks to nodemon.

**Production mode**

Just run the command:

```sh
npm run docker-up
```

Your server is ready!

### Local environment

First of all, you need to set on your shell all the needed env variables (See .env.sample file for more details)

Now you have to choose if you want to lunch the project in development mode or in production mode

**Development mode**

Since the limits of ts-node, you need to set a new env var: `TS_NODE_FILES=true`

Then you can run the command

```sh
npm run start:dev
```

Now, you are free to edit your code and see your changes without restarting the server manually.

**Production mode**

You need to first build the project

```sh
npm run build
```

Then you can run the command

```sh
npm run start
```

## Initialize the database

If you want to, the database will be initialized with some sample data.

To do that, you need to run the command:

```sh
npm run db-init
```

> Be careful, this command will erase all the data in the database and replace it with the sample data.
