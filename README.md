<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [FOAM-Recipes](#foam-recipes)
  - [Tutorial](#tutorial)
  - [Running This Example](#running-this-example)
    - [Prerequisites](#prerequisites)
    - [Setup](#setup)
    - [Run the Application](#run-the-application)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# FOAM-Recipes

This repository contains the completed [FOAM][foam-intro] cooking recipe database application from the FOAM tutorial. It serves as a reference for those who wish to explore the finished code without following the tutorial hands-on.

## Tutorial

The full tutorial has been moved to the main FOAM3 repository:

**[FOAM Tutorial](https://github.com/foam-foundation/foam3/blob/development/doc/tutorials/foam-tutorial.md)**

If you want to learn FOAM by building the application from scratch, follow the tutorial there. You'll start with an empty repository and build up the application step by step.

## Running This Example

If you only wish to run and explore the completed application, follow these steps:

### Prerequisites

You need <code>Java</code>, <code>Node.js</code> and <code>Maven</code> installed in your environment. Should you need to install them, helpful tips can be found in the [FOAM installation instructions][foam-install].

### Setup

Clone this repository, then add FOAM as a submodule:

```
git submodule add git@github.com:foam-foundation/foam3.git
git submodule update --init --recursive --rebase --force
```

Install the generic npm packages that FOAM depends on:

```
cd foam3/
./build.sh --install
cd ../
```

### Run the Application

```
./build.sh -Jdemo
```

Open your application in the web browser at http://localhost:8080/. Use one of the following credentials:

```
# administrator - full access
user: admin
password: badpassword

# regular non-privileged user - can only interact with Recipes
user: demo
password: demopassword
```

> [!IMPORTANT]
> To stop the FOAM server, type <code>CTRL</code>+C twice.

<!-- List all links here -->

[foam-intro]: https://docs.google.com/presentation/d/1yT6Yb5aJJ3OXD3n_8GKC_vtTs_rxJpzOQRgU1Oa_1r4/edit?usp=sharing
[foam-install]: https://github.com/foam-foundation/foam3/blob/development/INSTALL.md
