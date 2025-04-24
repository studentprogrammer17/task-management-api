import TaskRepository from "../repositories/task.repository";
import { CreateTaskDto, UpdateTaskDto } from "../models/task.model";

jest.mock("../services/database.service", () => {
  const mockDb = {
    exec: jest.fn(),
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn().mockResolvedValue([]),
  };

  return {
    __esModule: true,
    default: {
      getInstance: jest.fn(() => ({
        getDb: jest.fn(() => mockDb),
        initialize: jest.fn(),
      })),
    },
  };
});

describe("TaskRepository", () => {
  let taskRepo: typeof TaskRepository;
  let mockDb: any;

  beforeAll(() => {
    const DatabaseService = require("../services/database.service").default;
    const dbService = DatabaseService.getInstance();
    mockDb = dbService.getDb();
    taskRepo = TaskRepository;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.all.mockResolvedValue([]);
  });

  it("should create a task with valid data", async () => {
    const taskData: CreateTaskDto = {
      title: "Test Task",
      description: "This is a test task",
      status: "todo",
      subtasks: [],
    };

    (mockDb.run as jest.Mock).mockResolvedValueOnce(undefined);
    (mockDb.get as jest.Mock).mockResolvedValueOnce({
      id: "some-uuid",
      ...taskData,
      createdAt: new Date().toISOString(),
      subtasks: [],
    });

    const createdTask = await taskRepo.createTask(taskData);
    expect(createdTask).toHaveProperty("id");
    expect(createdTask.title).toBe(taskData.title);
    expect(createdTask.status).toBe(taskData.status);
  });

  it("should throw an error when creating a task without a title", async () => {
    const taskData = {
      description: "Missing title",
      status: "todo",
    } as any;

    await expect(taskRepo.createTask(taskData)).rejects.toThrow();
  });

  it("should retrieve a task by ID", async () => {
    const taskData: CreateTaskDto = {
      title: "Fetch Task",
      status: "todo",
      subtasks: [],
    };

    (mockDb.run as jest.Mock).mockResolvedValueOnce(undefined);
    const newTask = {
      id: "fake-id",
      title: taskData.title,
      status: taskData.status,
      createdAt: new Date().toISOString(),
      subtasks: [],
    };

    (mockDb.get as jest.Mock)
      .mockResolvedValueOnce(newTask)
      .mockResolvedValueOnce(newTask);

    const createdTask = await taskRepo.createTask(taskData);
    const fetchedTask = await taskRepo.getTaskById(createdTask.id);
    expect(fetchedTask.id).toBe(createdTask.id);
  });

  it("should update a task status", async () => {
    const taskData: CreateTaskDto = {
      title: "Update Status",
      status: "todo",
      subtasks: [],
    };

    const newTask = {
      id: "update-task-id",
      title: taskData.title,
      status: taskData.status,
      createdAt: new Date().toISOString(),
      subtasks: [],
    };

    (mockDb.run as jest.Mock).mockResolvedValueOnce(undefined);
    (mockDb.get as jest.Mock)
      .mockResolvedValueOnce(newTask)
      .mockResolvedValueOnce(newTask);

    const createdTask = await taskRepo.createTask(taskData);

    const updatedTask = { ...newTask, status: "done" };

    (mockDb.get as jest.Mock).mockImplementation(async (query, params) => {
      if (query.includes("SELECT * FROM tasks WHERE id = ?")) {
        if (params[0] === newTask.id) {
          return updatedTask;
        }
      }
      return newTask;
    });

    (mockDb.run as jest.Mock).mockResolvedValueOnce(undefined);

    const result = await taskRepo.updateTask(createdTask.id, {
      status: "done",
    });

    expect(result.status).toBe("done");
  });

  it("should delete a task", async () => {
    const taskData: CreateTaskDto = {
      title: "Delete Task",
      status: "todo",
      subtasks: [],
    };

    (mockDb.run as jest.Mock).mockResolvedValueOnce(undefined);
    const newTask = {
      id: "delete-task-id",
      title: taskData.title,
      status: taskData.status,
      createdAt: new Date().toISOString(),
      subtasks: [],
    };
    (mockDb.get as jest.Mock)
      .mockResolvedValueOnce(newTask)
      .mockResolvedValueOnce(newTask);

    const createdTask = await taskRepo.createTask(taskData);

    (mockDb.get as jest.Mock).mockResolvedValueOnce(newTask);
    (mockDb.run as jest.Mock).mockResolvedValueOnce(undefined);

    await expect(taskRepo.deleteTask(createdTask.id)).resolves.not.toThrow();
  });

  it("should retrieve a task with nested subtasks", async () => {
    const parentTaskId = "parent-id";
    const subtask1Id = "subtask1-id";
    const subtask2Id = "subtask2-id";
    const parentTaskData = {
      id: parentTaskId,
      title: "Parent Task",
      status: "todo",
      createdAt: new Date().toISOString(),
      subtasks: [],
    };

    const subtask1Data = {
      id: subtask1Id,
      title: "Subtask 1",
      status: "todo",
      createdAt: new Date().toISOString(),
      subtasks: [],
    };

    const subtask2Data = {
      id: subtask2Id,
      title: "Subtask 2",
      status: "in-progress",
      createdAt: new Date().toISOString(),
      subtasks: [],
    };

    (mockDb.get as jest.Mock).mockResolvedValueOnce(parentTaskData);
    (mockDb.all as jest.Mock)
      .mockResolvedValueOnce([subtask1Data, subtask2Data])
      .mockResolvedValue([]);
    const fetchedTask = await taskRepo.getTaskById(parentTaskId);
    expect(fetchedTask.subtasks?.length ?? 0).toBe(2);
    expect(fetchedTask.subtasks?.[0].id).toBe(subtask1Id);
    expect(fetchedTask.subtasks?.[1].id).toBe(subtask2Id);
  });
});
