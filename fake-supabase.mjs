// Credential-free in-memory stand-in for the Supabase client, mirroring the
// exact query chains the handler uses. Local fixtures only — not a database.
export function createFakeSupabase() {
  const tables = { messages: [] };

  const splitTopLevel = (input) => {
    const parts = [];
    let depth = 0;
    let current = "";
    for (const char of input) {
      if (char === "(") depth += 1;
      else if (char === ")") depth -= 1;
      if (char === "," && depth === 0) {
        parts.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    parts.push(current);
    return parts;
  };

  const condition = (field, op, value) => {
    if (op === "eq") return (row) => row[field] === value;
    if (op === "lt") return (row) => row[field] != null && row[field] < value;
    if (op === "is" && value === "null") return (row) => row[field] == null;
    if (op === "not.is" && value === "null") return (row) => row[field] != null;
    throw new Error(`fake_supabase_unsupported_condition:${field}.${op}.${value}`);
  };

  const parseTerm = (term) => {
    const trimmed = term.trim();
    if (trimmed.startsWith("and(") && trimmed.endsWith(")")) {
      const fns = splitTopLevel(trimmed.slice(4, -1)).map(parseTerm);
      return (row) => fns.every((fn) => fn(row));
    }
    if (trimmed.startsWith("or(") && trimmed.endsWith(")")) {
      const fns = splitTopLevel(trimmed.slice(3, -1)).map(parseTerm);
      return (row) => fns.some((fn) => fn(row));
    }
    const [field, op, ...rest] = trimmed.split(".");
    return condition(field, op, rest.join("."));
  };

  class QueryBuilder {
    constructor(tableName) {
      this.rows = tables[tableName];
      if (!this.rows) throw new Error(`fake_supabase_unknown_table:${tableName}`);
      this.filters = [];
      this.orders = [];
      this.max = null;
      this.op = "select";
      this.payload = null;
      this.resolveMode = null;
    }

    select() {
      return this;
    }

    insert(payload) {
      this.op = "insert";
      this.payload = payload;
      return this;
    }

    update(payload) {
      this.op = "update";
      this.payload = payload;
      return this;
    }

    delete() {
      this.op = "delete";
      return this;
    }

    eq(field, value) {
      this.filters.push(condition(field, "eq", value));
      return this;
    }

    in(field, values) {
      this.filters.push((row) => values.includes(row[field]));
      return this;
    }

    not(field, op, value) {
      this.filters.push(condition(field, `not.${op}`, value));
      return this;
    }

    or(expression) {
      const terms = splitTopLevel(expression).map(parseTerm);
      this.filters.push((row) => terms.some((term) => term(row)));
      return this;
    }

    order(field, options) {
      this.orders.push([field, options?.ascending !== false]);
      return this;
    }

    limit(count) {
      this.max = count;
      return this;
    }

    maybeSingle() {
      this.resolveMode = "one";
      return this;
    }

    single() {
      this.resolveMode = "one";
      return this;
    }

    then(onFulfilled, onRejected) {
      return this.run().then(onFulfilled, onRejected);
    }

    async run() {
      const matches = (row) => this.filters.every((filter) => filter(row));
      let data;
      if (this.op === "insert") {
        const row = { ...this.payload };
        this.rows.push(row);
        data = row;
      } else if (this.op === "update") {
        const matched = this.rows.filter(matches);
        for (const row of matched) Object.assign(row, this.payload);
        data = matched;
      } else if (this.op === "delete") {
        const matched = this.rows.filter(matches);
        for (const row of matched) this.rows.splice(this.rows.indexOf(row), 1);
        data = matched;
      } else {
        let matched = this.rows.filter(matches);
        for (const [field, ascending] of [...this.orders].reverse()) {
          matched = matched.slice().sort((a, b) => {
            if (a[field] === b[field]) return 0;
            return (a[field] < b[field] ? -1 : 1) * (ascending ? 1 : -1);
          });
        }
        if (this.max != null) matched = matched.slice(0, this.max);
        data = matched;
      }
      if (this.resolveMode === "one") {
        const row = Array.isArray(data) ? data[0] : data;
        return { data: row ?? null, error: null };
      }
      return { data, error: null };
    }
  }

  return { from: (tableName) => new QueryBuilder(tableName) };
}
