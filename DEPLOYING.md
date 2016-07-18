# Deploying SwarmControlRedux

## Inital dependencies

# Local install

# Heroku install

## Setting up the database

# Local install

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

Next, run the schema SQL file:

```
psql -h localhost -d swarm -U swarmcontrol --password -p 5432 -f database/schema.sql
```

Enter the passwword when prompted, and then check that the schema worked:

```
\connect swarm
\dt
```


# Heroku install

## Setting up the game
