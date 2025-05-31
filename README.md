# Typescript OOP Training Template

This project is a learning template designed to help developers understand how to build modular, scalable RESTful APIs using TypeScript and Object-Oriented Programming (OOP) principles. It demonstrates clean architecture with separation of concerns across models, services, controllers, and routes.

## Table of Contents

* [Overview](#overview)
* [Project Structure](#project-structure)
* [Getting Started](#getting-started)
* [File & Folder Documentation](#file--folder-documentation)

  * [config/](#config)
  * [controllers/](#controllers)
  * [models/](#models)
  * [routes/](#routes)
  * [services/](#services)
* [License](#license)

---

## Overview

This template is designed to help developers practice TypeScript and OOP patterns in a real-world backend architecture. It separates concerns into logical layers and uses TypeScript interfaces for strong typing and maintainability.

---

## Project Structure

```
.
├── config/
│   └── db.ts
├── controllers/
│   └── UserController.ts
├── models/
│   └── User.ts
├── routes/
│   └── UserRoutes.ts
├── services/
│   └── UserService.ts
├── index.ts
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

---

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a `.env` file**

   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/oop_training
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

---

## File & Folder Documentation

### config/

**`database.ts`**

* Handles connection to MongoDB using Mongoose.
* Reads `MONGO_URI` from environment variables.
* Exports an async function to initialize the database connection.

### controllers/

**`UserController.ts`**

* Accepts HTTP requests and delegates business logic to the service layer.
* Parses and validates request data.
* Handles success and error HTTP responses.
* Implements controller methods such as `registerUser`.

### models/

**`UserModel.ts`**

* Defines the Mongoose schema and model for User documents.
* Includes a TypeScript `IUser` interface for type safety.
* Defines model methods for creating, updating, and deleting users.
* Encapsulates Stripe logic and password hashing.
* Indexes and lifecycle hooks are set up here.

### routes/

**`UserRoutes.ts`**

* Defines Express routes related to user operations.
* Each route maps to a method in the `UserController`.
* Example:

  * `POST /api/users` -> `userController.registerUser`

### services/

**`UserService.ts`**

* Encapsulates business logic related to user operations.
* Acts as a bridge between the controller and the model layer.
* Handles:

  * `createUser`
  * `getUserByEmail`
  * `getUserByUsername`
  * Any other user-related logic required by the controller.

---

## License

This project is licensed under the MIT License.

---

Happy coding! 🚀
