import DatabaseService from "../services/database.service";

beforeAll(async () => {
  const dbService = DatabaseService.getInstance();
  await dbService.initialize();
});

afterAll(async () => {
  const dbService = DatabaseService.getInstance();
  const db = dbService.getDb();
  await db.close();
});
