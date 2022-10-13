const { request, response } = require("express");
const express = require("express");
const { Statement } = require("sqlite3");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

// Podemos passar query params para verificação de itens ou enviá-los via headers

// todo midware deve receber 3 parâmetros. ele ocorre antes da função em si, e o next passa para a próxima função

function verifyIfExistsAcountCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: "Customer no found" });
  }

  request.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const custumerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (custumerAlreadyExists) {
    return response.status(400).json({ error: " Customer already exists" });
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });
  return response.status(201).send();
});

app.get("/statement", verifyIfExistsAcountCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer.statement);
});

app.post("/deposit", verifyIfExistsAcountCPF, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };
  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post("/withdraw", verifyIfExistsAcountCPF, (request, response) => {
  const { amount } = request.body;

  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: "Insuficient funds" });
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit",
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.get("/statement/date", verifyIfExistsAcountCPF, (request, response) => {
  const { customer } = request;

  const { date } = request.query;

  const  dateFormat = new Date(date = "00:00")

  const statement = customer.statement.filter(
    (statement) =>
    statement.created_at.toDateString() ===
    new Date(dateFormat).toDateString()
  );

  return response.json(customer.statement);
});

app.listen(3334);

app.use(express.json());

// app.get("/courses", (request, response) => {
//   const query = request.query;
//   console.log(query);
//   return response.json(["curso1", "curso2", "curso3"]);
// });
// app.post("/courses", (request, response) => {
//   const body = request.body;
//   console.log(body);
//   return response.json(["curso1", "curso2", "curso3"]);
// });
// app.put("/courses/:id", (request, response) => {
//   return response.json(["curso1", "curso2", "curso3"]);
// });
// app.patch("/courses/:id", (request, response) => {
//   return response.json(["curso1", "curso2", "curso3"]);
// });
// app.delete("/courses/:id", (request, response) => {
//   return response.json(["curso1", "curso2", "curso3"]);
// });
