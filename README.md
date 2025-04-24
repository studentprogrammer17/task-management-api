# Task Management API

## Overview

This is a full-stack TypeScript application for a task management system, where users can create, read, update, and delete tasks and subtasks. The application includes a backend API built with Node.js and Express.js, a frontend using React, and unit tests using Jest to ensure functionality.

## Installation

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Run the backend in development mode:

   ```bash
   npm run start:dev
   ```

   This will start the backend server and listen for requests on the configured port.

## Running Tests

1. For running unit tests for the backend, navigate to the backend directory and run:

   ```bash
   npm test
   ```

   This will run all unit tests defined using Jest.

## Example API Requests

### Create a Task

- **Method**: POST
- **Endpoint**: `/tasks`
- **Request Body**:
  ```json
  {
    "title": "New Task",
    "description": "This is a new task",
    "status": "todo",
    "subtasks": []
  }
  ```
- **Response**:
  ```json
  {
    "id": "task-id",
    "title": "New Task",
    "description": "This is a new task",
    "status": "todo",
    "createdAt": "2025-03-14T12:34:56Z",
    "subtasks": []
  }
  ```

### Update a Task Status

- **Method**: PUT
- **Endpoint**: `/tasks/{taskId}`
- **Request Body**:
  ```json
  {
    "status": "done"
  }
  ```
- **Response**:
  ```json
  {
    "id": "task-id",
    "title": "New Task",
    "description": "This is a new task",
    "status": "done",
    "createdAt": "2025-03-14T12:34:56Z",
    "subtasks": []
  }
  ```

### Get All Tasks

- **Method**: GET
- **Endpoint**: `/tasks`
- **Response**:
  ```json
  [
    {
      "id": "task-id-1",
      "title": "Task 1",
      "description": "Description for Task 1",
      "status": "todo",
      "createdAt": "2025-03-14T12:00:00Z",
      "subtasks": [
        {
          "id": "subtask-id-1",
          "title": "Subtask 1 for Task 1",
          "description": "Subtask 1 description",
          "status": "in-progress",
          "createdAt": "2025-03-14T12:10:00Z",
          "subtasks": []
        }
      ]
    },
    {
      "id": "task-id-2",
      "title": "Task 2",
      "description": "Description for Task 2",
      "status": "done",
      "createdAt": "2025-03-14T12:30:00Z",
      "subtasks": []
    }
  ]
  ```

### Get Task by ID

- **Method**: GET
- **Endpoint**: `/tasks/{taskId}`
- **Response**:
  ```json
  {
    "id": "task-id",
    "title": "New Task",
    "description": "This is a new task",
    "status": "todo",
    "createdAt": "2025-03-14T12:34:56Z",
    "subtasks": []
  }
  ```

### Delete a Task

- **Method**: DELETE
- **Endpoint**: `/api/tasks/{taskId}`
