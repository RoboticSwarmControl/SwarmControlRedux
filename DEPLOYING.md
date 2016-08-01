# Deploying SwarmControlRedux

## Inital dependencies

You'll need an installation of PostgreSQL (available [here](https://www.postgresql.org/download/)). Make note of the password for the `postgres` user, because you'll need it later when setting up the database.

You'll need an installation of Node 5.10 (available [here](https://nodejs.org/dist/latest-v5.x/)).

### Local install

First, you'll need to make sure that you've got NodeJS 5.10.0 [from here](https://nodejs.org/dist/latest-v5.x/), or [here](https://nodejs.org/dist/latest-v5.x/) for Mac OS.

Next, you'll need to download the repo:

```
$ git clone https://github.com/RoboticSwarmControl/SwarmControlRedux.git
```

Then, you need to install the application, go to the folder you have cloned, and install:

```
$ npm install
```

After, you need to build the client resources. This will copy around the vendor scripts and compile the games.

This is also when linting will occur.

```
$ npm run-script build
```

## Setting up the database

### Local install

You'll need a Postgres console and an administrator account. For Mac OS, use [instruction here](https://launchschool.com/blog/how-to-install-postgresql-on-a-mac)


Do this one time from the SQL server: create a swarm control database, a user, and privileges for that user on the database.

```
CREATE DATABASE swarm;
CREATE USER swarmcontrol WITH PASSWORD 'test';
GRANT ALL PRIVILEGES ON DATABASE swarm TO swarmcontrol;
```

Verify the user and the database are created:

```
\l
\du
```

Next, run the schema SQL file from your command line:

```
$ psql -h localhost -d swarm -U swarmcontrol --password -p 5432 -f database/schema.sql
```

Enter the password when prompted, and then check that the schema worked:

```
\connect swarm
\dt
```