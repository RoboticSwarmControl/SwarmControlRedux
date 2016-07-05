# SwarmControlRedux

[![Build Status](https://travis-ci.org/RoboticSwarmControl/SwarmControlRedux.svg?branch=master)](https://travis-ci.org/RoboticSwarmControl/SwarmControlRedux)

This is the Node reimplementation of the SwarmControl website.

## Installation

First, you'll need to make sure that you've got NodeJS 5.10.0 [from here](https://nodejs.org/en/blog/release/v0.5.10/).

Next, you'll need to download the repo:

```
$ git clone https://github.com/RoboticSwarmControl/SwarmControlRedux.git
```

Then, you need to install the application.

```
$ npm install
```

After, you need to build the client resources. This will copy around the vendor scripts and compile the games.

This is also when linting will occur.

```
$ npm run-script build
```

Lastly, run the application.

```
$ npm start
```

## Useful scripts

There are several scripts that are setup that can help during development. All can be used by invoking `npm run-script $script_name`, with the desired script name in place of `$script_name`.

Script name | Function | When to use
------------|----------|-------------
build 		| Builds client styles, scripts, and games | Every time changes are made to game or client code, or at first install.
build-no-lint | Runs a full build, without linting.		| Run manually to build in presnce of linting errors. This is helpful when refactoring games.
clean 		| Cleans client styles, scripts, and games. | Invoked during build. Can be run manually to fix weirdness.
lint        | Lints (checks for scripting errors) server, client, and game scripts. | Invoked during build. Can be run manually to check for syntax errors--very helpful.
lint:games	| Lints (checks for scripting errors) just game scripts. | Can be run manually to check for syntax errors in games--very helpful during game development.
start		| Starts the server.	| Used to start the server.
