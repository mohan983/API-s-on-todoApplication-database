const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityAndCategoryProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

//validation

const validation = (request, response, next) => {
  const { status, priority, category, dueDate } = request.query;
  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    next();
  } else {
    Response.status(400);
    response.send("Invalid Todo Status");
  }
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    next();
  } else {
    Response.status(400);
    response.send("Invalid Todo Priority");
  }
  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    next();
  } else {
    Response.status(400);
    response.send("Invalid Todo Category");
  }
};

//API_1

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
   SELECT
    id,todo,category,priority,status,due_date AS dueDate
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
     id,todo,category,priority,status,due_date AS dueDate
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
     id,todo,category,priority,status,due_date AS dueDate
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodosQuery = `
   SELECT
     id,todo,category,priority,status,due_date AS dueDate
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND category = '${category}';`;
      break;
    case hasPriorityAndCategoryProperties(request.query):
      getTodosQuery = `
   SELECT
     id,todo,category,priority,status,due_date AS dueDate
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND category = '${category}'
    AND priority = '${priority}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodosQuery = `
   SELECT
     id,todo,category,priority,status,due_date AS dueDate
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND category = '${category}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
     id,todo,category,priority,status,due_date AS dueDate
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//API_2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodosQuery = `
      SELECT
         id,todo,category,priority,status,due_date AS dueDate
      FROM 
        todo
      WHERE 
        id='${todoId}';
    `;
  const todo = await db.get(getTodosQuery);
  response.send(todo);
});

//API_3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const getTodosQuery = `
      SELECT
         id,todo,category,priority,status,due_date AS dueDate
      FROM 
        todo
      WHERE 
        due_date='${date}';
    `;
  const todo = await db.get(getTodosQuery);
  response.send(todo);
});

//API_4

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, category, priority, status, dueDate } = todoDetails;
  const addTodoDetails = `
    INSERT INTO
      todo(id, todo , category, priority ,status,due_date)
    VALUES
      (
        '${id}',
        '${todo}',
        '${category}',
        '${priority}',
        '${status}',
        '${dueDate}'
      );`;

  const dbResponse = await db.run(addTodoDetails);
  const todoId = dbResponse.lastID;
  response.send("Todo Successfully Added");
});

//API_5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `
     SELECT
       *
     FROM
       todo
     WHERE
       id='${todoId}';
  `;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodoDetails = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
      category='${category}',
      due_date='${dueDate}'
    WHERE
      id='${todoId}';
  `;

  const dbResponse = await db.run(updateTodoDetails);

  response.send(`${updateColumn} Updated`);
});

//API_6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoDetails = `
    DELETE FROM
      todo
    WHERE
      id='${todoId}';
      `;

  const dbResponse = await db.run(deleteTodoDetails);

  response.send("Todo Deleted");
});

module.exports = app;
