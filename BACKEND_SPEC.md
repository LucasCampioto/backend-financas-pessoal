# Especificação do Back-end — FinControl

Este documento descreve o back-end a ser desenvolvido para a aplicação FinControl, com base no frontend atual (autenticação e dados financeiros em localStorage). Objetivo: persistir usuários e dados por conta, substituindo localStorage por uma API REST.

---

## 1. Visão geral

- **Objetivo:** Persistir usuários (cadastro/login) e dados financeiros (receitas, despesas, configuração de impostos) por conta, com autenticação.
- **Premissas:**
  - Autenticação por token (ex.: JWT) ou sessão.
  - Todos os dados financeiros são escopados por usuário (email ou userId).
  - Datas no formato `YYYY-MM-DD`; meses no formato `YYYY-MM`. Valores monetários em `number`. Identificadores em string UUID.

---

## 2. Autenticação

### 2.1 Signup (criar conta)

| Item | Especificação |
|------|----------------|
| **Método** | `POST` |
| **Path** | `/api/auth/signup` (ou `/api/users`) |
| **Entrada (body JSON)** | `name` (string), `email` (string), `password` (string) |
| **Saída sucesso** | Status `201` (ou `200`). Corpo: `{ user: { email, name } }`. O token JWT é enviado em um cookie HttpOnly (nome: `token`). |
| **Saída erro** | `409` — email já cadastrado. `400` — validação (campos obrigatórios, formato de email). Corpo: `{ message: string }` |

**Exemplo de entrada:**

```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "password": "senha123"
}
```

**Exemplo de saída (201):**

```json
{
  "user": { "email": "joao@exemplo.com", "name": "João Silva" }
}
```

O servidor define o cookie `token` (HttpOnly) com o JWT na resposta.

---

### 2.2 Login

| Item | Especificação |
|------|----------------|
| **Método** | `POST` |
| **Path** | `/api/auth/login` |
| **Entrada (body JSON)** | `email` (string), `password` (string) |
| **Saída sucesso** | Status `200`. Corpo: `{ user: { email, name } }`. O token JWT é enviado em um cookie HttpOnly (nome: `token`). |
| **Saída erro** | `401` — credenciais inválidas. `400` — validação. Corpo: `{ message: string }` |

**Exemplo de entrada:**

```json
{
  "email": "joao@exemplo.com",
  "password": "senha123"
}
```

**Exemplo de saída (200):** igual ao signup (apenas `{ user }`; token no cookie HttpOnly).

---

### 2.3 Logout

| Item | Especificação |
|------|----------------|
| **Método** | `POST` ou `DELETE` |
| **Path** | `/api/auth/logout` |
| **Entrada** | Cookie com o token (nome `token`) ou header `Authorization: Bearer <token>` |
| **Saída** | `204` No Content. O cookie `token` é removido/invalidado. |

---

### 2.4 Dados do usuário autenticado

| Item | Especificação |
|------|----------------|
| **Método** | `GET` |
| **Path** | `/api/auth/me` ou `/api/user` |
| **Entrada** | Cookie com o token (nome `token`) ou header `Authorization: Bearer <token>` |
| **Saída sucesso** | Status `200`. Corpo: `{ email: string, name: string }` |
| **Saída erro** | `401` — não autenticado ou token inválido |

---

## 3. Modelos de dados (tipos)

O back-end deve devolver e aceitar os dados nos formatos abaixo, compatíveis com o frontend.

### 3.1 User (retornado em auth; senha nunca é retornada)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `email` | string | Email único do usuário |
| `name`  | string | Nome de exibição |

---

### 3.2 Revenue (receita)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string (UUID) | sim (saída) | Gerado pelo servidor; omitido na entrada |
| `description` | string | sim | Descrição da receita |
| `amount` | number | sim | Valor monetário |
| `date` | string | sim | Data no formato `YYYY-MM-DD` |
| `type` | string | sim | `"comprovado"` ou `"nao_comprovado"` |
| `recurring` | boolean | não | Se repete todo mês (default: false) |
| `recurrenceEndMonth` | string | não | Até qual mês a recorrência vale (`YYYY-MM`); omitido = indefinido |

---

### 3.3 Expense (despesa)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string (UUID) | sim (saída) | Gerado pelo servidor; omitido na entrada |
| `description` | string | sim | Descrição da despesa |
| `amount` | number | sim | Valor monetário |
| `date` | string | sim | Data no formato `YYYY-MM-DD` |
| `category` | string | sim | Categoria (pode ser vazio "") |
| `bank` | string | sim | Banco/cartão (ex.: "Cartão de Crédito") |
| `recurring` | boolean | não | Se repete todo mês (default: false) |
| `recurrenceEndMonth` | string | não | Até qual mês a recorrência vale (`YYYY-MM`); omitido = indefinido |

---

### 3.4 TaxConfig (configuração de impostos)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `percentual` | number | Alíquota em % sobre receita comprovada |
| `fixedTaxes` | array | Lista de impostos fixos |
| `fixedTaxes[].id` | string (UUID) | Identificador do item |
| `fixedTaxes[].description` | string | Descrição do imposto |
| `fixedTaxes[].amount` | number | Valor fixo |

---

### 3.5 FinanceData (agregado de dados financeiros do usuário)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `revenues` | Revenue[] | Todas as receitas do usuário |
| `expenses` | Expense[] | Todas as despesas do usuário |
| `taxConfig` | TaxConfig | Configuração de impostos |

---

### 3.6 MonthSummary (opcional no back-end)

Pode ser calculado no frontend a partir de `FinanceData` ou por endpoint dedicado. Se o back-end expuser:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `month` | string | `YYYY-MM` |
| `label` | string | Ex.: "Mai 2026" |
| `revenues` | Revenue[] | Receitas do mês (incl. recorrentes) |
| `expenses` | Expense[] | Despesas do mês (incl. recorrentes) |
| `totalRevenue` | number | Soma das receitas |
| `totalExpenses` | number | Soma das despesas |
| `totalTax` | number | Imposto total (percentual sobre comprovado + fixos) |
| `netProfit` | number | totalRevenue - totalExpenses - totalTax |
| `totalCreditCard` | number | Soma de despesas com bank "Cartão de Crédito" ou "Importado" |
| `totalRevenueComprovado` | number | Soma de receitas com type "comprovado" |

---

## 4. Endpoints de dados financeiros

Todos os endpoints abaixo exigem autenticação (cookie `token` ou header `Authorization: Bearer <token>`) e devem escopar os dados pelo usuário autenticado.

### 4.1 Obter todos os dados financeiros

| Item | Especificação |
|------|----------------|
| **Método** | `GET` |
| **Path** | `/api/finances` ou `/api/user/finances` |
| **Entrada** | Nenhum (cookie `token` ou header Authorization) |
| **Saída sucesso** | Status `200`. Corpo: objeto no formato `FinanceData` (revenues, expenses, taxConfig) |
| **Saída erro** | `401` — não autenticado |

**Exemplo de saída (200):**

```json
{
  "revenues": [],
  "expenses": [],
  "taxConfig": { "percentual": 6, "fixedTaxes": [] }
}
```

---

### 4.2 Receitas

**Criar receita**

| Item | Especificação |
|------|----------------|
| **Método** | `POST` |
| **Path** | `/api/revenues` |
| **Entrada (body)** | `Omit<Revenue, "id">`: description, amount, date, type, recurring? |
| **Saída sucesso** | Status `201`. Corpo: objeto `Revenue` completo (com `id` gerado pelo servidor) |
| **Saída erro** | `400` — validação. `401` — não autenticado |

**Remover receita**

| Item | Especificação |
|------|----------------|
| **Método** | `DELETE` |
| **Path** | `/api/revenues/:id` |
| **Entrada** | `id` no path (UUID da receita) |
| **Saída sucesso** | Status `204` No Content ou `200` |
| **Saída erro** | `404` — receita não encontrada ou de outro usuário. `401` — não autenticado |

---

### 4.3 Despesas

**Criar despesa**

| Item | Especificação |
|------|----------------|
| **Método** | `POST` |
| **Path** | `/api/expenses` |
| **Entrada (body)** | `Omit<Expense, "id">`: description, amount, date, category, bank, recurring? |
| **Saída sucesso** | Status `201`. Corpo: objeto `Expense` completo (com `id`) |
| **Saída erro** | `400` — validação. `401` — não autenticado |

**Criar despesas em lote (importação)**

| Item | Especificação |
|------|----------------|
| **Método** | `POST` |
| **Path** | `/api/expenses/bulk` |
| **Entrada (body)** | Array de `Omit<Expense, "id">` |
| **Saída sucesso** | Status `201`. Corpo: array de `Expense` com `id` gerados |
| **Saída erro** | `400` — validação. `401` — não autenticado |

**Remover despesa**

| Item | Especificação |
|------|----------------|
| **Método** | `DELETE` |
| **Path** | `/api/expenses/:id` |
| **Entrada** | `id` no path (UUID da despesa) |
| **Saída sucesso** | Status `204` ou `200` |
| **Saída erro** | `404` — despesa não encontrada ou de outro usuário. `401` — não autenticado |

**Remover todas as despesas de um mês**

| Item | Especificação |
|------|----------------|
| **Método** | `DELETE` |
| **Path** | `/api/expenses/by-month/:month` |
| **Entrada** | `month` no path no formato `YYYY-MM` |
| **Saída sucesso** | Status `204` ou `200` |
| **Saída erro** | `401` — não autenticado |

**Substituir despesas de cartão de crédito do mês (opcional)**

Operação atômica: remover do mês todas as despesas com `bank` igual a "Cartão de Crédito" ou "Importado" e inserir a nova lista.

| Item | Especificação |
|------|----------------|
| **Método** | `PUT` ou `POST` |
| **Path** | `/api/expenses/replace-credit-card/:month` |
| **Entrada (body)** | `{ expenses: Omit<Expense, "id">[] }`. Path: `month` = `YYYY-MM` |
| **Saída sucesso** | Status `200`. Corpo: `FinanceData` atualizado ou array das novas despesas com `id` |
| **Saída erro** | `400` — validação. `401` — não autenticado |

---

### 4.4 Configuração de impostos

**Obter configuração**

| Item | Especificação |
|------|----------------|
| **Método** | `GET` |
| **Path** | `/api/tax-config` |
| **Entrada** | Nenhum (cookie `token` ou header Authorization) |
| **Saída sucesso** | Status `200`. Corpo: `TaxConfig` |
| **Saída erro** | `401` — não autenticado |

**Atualizar configuração**

| Item | Especificação |
|------|----------------|
| **Método** | `PUT` |
| **Path** | `/api/tax-config` |
| **Entrada (body)** | Objeto `TaxConfig` completo (percentual, fixedTaxes) |
| **Saída sucesso** | Status `200`. Corpo: `TaxConfig` atualizado |
| **Saída erro** | `400` — validação. `401` — não autenticado |

---

## 5. Resumo — Formatos de entrada e saída

| Endpoint | Método | Entrada | Saída | Códigos |
|----------|--------|---------|-------|---------|
| `/api/auth/signup` | POST | `{ name, email, password }` | `{ user: { email, name } }` + cookie `token` HttpOnly | 201, 400, 409 |
| `/api/auth/login` | POST | `{ email, password }` | `{ user: { email, name } }` + cookie `token` HttpOnly | 200, 400, 401 |
| `/api/auth/logout` | POST/DELETE | cookie `token` ou header | (vazio; cookie removido) | 204/200, 401 |
| `/api/auth/me` | GET | cookie `token` ou header | `{ email, name }` | 200, 401 |
| `/api/finances` | GET | — | `FinanceData` | 200, 401 |
| `/api/revenues` | POST | `Omit<Revenue, "id">` | `Revenue` | 201, 400, 401 |
| `/api/revenues/:id` | PUT | `Omit<Revenue, "id">` (body completo) | `Revenue` | 200, 400, 401, 404 |
| `/api/revenues/:id` | DELETE | — | — | 204/200, 401, 404 |
| `/api/expenses` | POST | `Omit<Expense, "id">` | `Expense` | 201, 400, 401 |
| `/api/expenses/:id` | PUT | `Omit<Expense, "id">` (body completo) | `Expense` | 200, 400, 401, 404 |
| `/api/expenses/bulk` | POST | `Omit<Expense, "id">[]` | `Expense[]` | 201, 400, 401 |
| `/api/expenses/:id` | DELETE | — | — | 204/200, 401, 404 |
| `/api/expenses/by-month/:month` | DELETE | — | — | 204/200, 401 |
| `/api/expenses/replace-credit-card/:month` | PUT/POST | `{ expenses: Omit<Expense, "id">[] }` | atualizado ou lista | 200, 400, 401 |
| `/api/tax-config` | GET | — | `TaxConfig` | 200, 401 |
| `/api/tax-config` | PUT | `TaxConfig` | `TaxConfig` | 200, 400, 401 |

**Convenções:** Datas em `YYYY-MM-DD`; mês em `YYYY-MM`. Valores monetários em `number`. IDs em string UUID. Senha nunca retornada; usar hash (ex.: bcrypt) no armazenamento.

---

## 6. Considerações adicionais

- **Senha:** Armazenar apenas hash (ex.: bcrypt); nunca texto plano.
- **Token:** JWT ou sessão com tempo de expiração; definir política de refresh token se necessário.
- **CORS:** Habilitar para o domínio/origem do frontend.
- **Versionamento:** Considerar prefixo `/v1/` para a API (ex.: `/v1/api/auth/login`).
- **Validação:** Validar obrigatoriedade e formato de campos (email, date, amount > 0, type enum, etc.) e retornar `400` com mensagem clara.
