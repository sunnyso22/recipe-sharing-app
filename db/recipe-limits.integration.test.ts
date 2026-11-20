import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, test } from "bun:test";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres, { type Sql } from "postgres";

import {
  DESCRIPTION_LIMIT,
  INSTRUCTION_LIMIT,
  LIST_LIMIT,
  TEXT_LIMIT,
} from "@/lib/recipes/limits";

const postgresBin = () => {
  const root = "/usr/lib/postgresql";

  try {
    const versions = readdirSync(root).sort().reverse();

    for (const version of versions) {
      const bin = path.join(root, version, "bin");

      return bin;
    }
  } catch {
    return null;
  }

  return null;
};

const bin = postgresBin();

const freePort = async () => {
  const server = createServer();

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  return port;
};

const messageOf = async (run: () => Promise<unknown>) => {
  try {
    await run();
  } catch (error) {
    const parts: string[] = [];
    let current: unknown = error;

    while (current instanceof Error) {
      parts.push(current.message);
      current = "cause" in current ? current.cause : undefined;
    }

    return parts.join("\n");
  }

  return "";
};

const quoteIdent = (value: string) => {
  return `"${value.replaceAll('"', '""')}"`;
};

describe.skipIf(!bin)("recipe database limits", () => {
  const binDir = bin ?? "";
  let dataDir = "";
  let socketDir = "";
  let port = 0;
  let admin: Sql;
  let db: Sql;
  const ownerId = "11111111-1111-1111-1111-111111111111";
  const otherId = "22222222-2222-2222-2222-222222222222";

  const open = (database: string) => {
    return postgres({
      host: socketDir,
      port,
      username: "postgres",
      database,
      max: 12,
    });
  };

  const psql = (database: string, statement: string) => {
    return execFileSync(path.join(binDir, "psql"), [
      "-h",
      socketDir,
      "-p",
      String(port),
      "-U",
      "postgres",
      "-d",
      database,
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      statement,
    ], {
      encoding: "utf8",
    });
  };

  const createDatabase = async (name: string) => {
    await admin.unsafe(`create database ${quoteIdent(name)}`);
    psql(
      name,
      `
        create schema auth;
        create table auth.users (id uuid primary key);
        create function auth.uid()
        returns uuid
        language sql
        stable
        as $$
          select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
        $$;
      `,
    );
  };

  const applyMigrationFile = async (database: string, folder: string) => {
    const sqlText = readFileSync(
      path.join(import.meta.dir, "../drizzle", folder, "migration.sql"),
      "utf8",
    );
    const client = open(database);

    try {
      for (const statement of sqlText.split("--> statement-breakpoint")) {
        const trimmed = statement.trim();

        if (trimmed.length > 0) {
          await client.unsafe(trimmed);
        }
      }
    } finally {
      await client.end();
    }
  };

  const insertRecipe = async (
    title = "Soup",
    description = "Warm",
    userId = ownerId,
  ) => {
    const [row] = await db`
      insert into public.recipes (user_id, title, description)
      values (${userId}, ${title}, ${description})
      returning id
    `;

    return row.id as number;
  };

  const counter = async (recipeId: number) => {
    const [row] = await db`
      select
        ingredient_count,
        seasoning_count,
        instruction_count,
        (
          select count(*)::int
          from public.ingredients
          where recipe_id = ${recipeId}
        ) as ingredient_rows,
        (
          select count(*)::int
          from public.seasonings
          where recipe_id = ${recipeId}
        ) as seasoning_rows,
        (
          select count(*)::int
          from public.instructions
          where recipe_id = ${recipeId}
        ) as instruction_rows
      from recipe_guard.recipe_collection_counts
      where recipe_id = ${recipeId}
    `;

    return row;
  };

  const fill = async (
    table: "ingredients" | "seasonings" | "instructions",
    recipeId: number,
    count: number,
  ) => {
    if (table === "instructions") {
      await db`
        insert into public.instructions (recipe_id, step_number, description)
        select ${recipeId}, g, 'Step'
        from generate_series(1, ${count}) as g
      `;
      return;
    }

    await db.unsafe(
      `insert into public.${table} (recipe_id, name, quantity)
       select $1, 'item', g::text
       from generate_series(1, $2) as g`,
      [recipeId, count],
    );
  };

  beforeAll(async () => {
    dataDir = mkdtempSync(path.join(tmpdir(), "recipe-limits-"));
    socketDir = mkdtempSync(path.join(tmpdir(), "recipe-limits-socket-"));
    port = await freePort();
    execFileSync(path.join(binDir, "initdb"), [
      "-D",
      dataDir,
      "--username=postgres",
      "--auth=trust",
      "--no-instructions",
    ]);
    execFileSync(path.join(binDir, "pg_ctl"), [
      "-D",
      dataDir,
      "-l",
      path.join(dataDir, "server.log"),
      "-w",
      "start",
      "-o",
      `-p ${port} -k ${socketDir} -c listen_addresses=`,
    ]);

    admin = open("postgres");
    await admin.unsafe(`
      do $$
      begin
        begin
          create role anon nologin;
        exception when duplicate_object then null;
        end;

        begin
          create role authenticated nologin;
        exception when duplicate_object then null;
        end;

        begin
          create role authenticator noinherit login;
        exception when duplicate_object then null;
        end;

        begin
          create role service_role nologin;
        exception when duplicate_object then null;
        end;
      end $$;
    `);
    await admin.unsafe("grant authenticated to postgres");
    await admin.unsafe("grant authenticated to authenticator");
    await admin.unsafe("grant anon to authenticator");

    await createDatabase("recipe_limits");
    const client = open("recipe_limits");

    try {
      await migrate(drizzle({ client }), {
        migrationsFolder: path.join(import.meta.dir, "../drizzle"),
      });
    } finally {
      await client.end();
    }

    db = open("recipe_limits");
    await db`
      insert into auth.users (id)
      values (${ownerId}::uuid), (${otherId}::uuid)
    `;

    process.env.DATABASE_URL = `postgres://postgres@/recipe_limits?host=${socketDir}&port=${port}`;
  }, 60_000);

  test("drizzle migration records three migrations and backfills no rows", async () => {
    const applied = await db`
      select name
      from drizzle.__drizzle_migrations
      order by id
    `;

    assert.deepEqual(
      applied.map((row) => row.name),
      [
        "20261112122015_baseline",
        "20261112122305_ownership_and_rls",
        "20261120062415_recipe_validation",
      ],
    );
    const [counts] = await db`
      select count(*)::int as count
      from recipe_guard.recipe_collection_counts
    `;
    assert.equal(counts.count, 0);
  });

  test("enforces description, instruction, and varchar lengths", async () => {
    const recipeId = await insertRecipe("a".repeat(TEXT_LIMIT), "a".repeat(DESCRIPTION_LIMIT));

    assert.match(
      await messageOf(() => insertRecipe("a".repeat(TEXT_LIMIT + 1), "Warm")),
      /value too long/,
    );
    const tooLong = await messageOf(() =>
      db`
        update public.recipes
        set description = ${"a".repeat(DESCRIPTION_LIMIT + 1)}
        where id = ${recipeId}
      `,
    );
    assert.match(tooLong, /recipes_description_length/);

    await db`
      insert into public.instructions (recipe_id, step_number, description)
      values (${recipeId}, 1, ${"a".repeat(INSTRUCTION_LIMIT)})
    `;
    const longStep = await messageOf(() =>
      db`
        insert into public.instructions (recipe_id, step_number, description)
        values (${recipeId}, 2, ${"a".repeat(INSTRUCTION_LIMIT + 1)})
      `,
    );
    assert.match(longStep, /instructions_description_length/);

    const longName = await messageOf(() =>
      db`
        insert into public.ingredients (recipe_id, name, quantity)
        values (${recipeId}, ${"a".repeat(TEXT_LIMIT + 1)}, '1')
      `,
    );
    assert.match(longName, /value too long/);

    const recipe = await counter(recipeId);
    assert.equal(recipe.ingredient_rows, 0);
    assert.equal(recipe.instruction_rows, 1);
  });

  test("keeps empty text and empty collections allowed", async () => {
    const recipeId = await insertRecipe("Soup", "   ");
    const recipe = await counter(recipeId);

    assert.equal(recipe.ingredient_count, 0);
    assert.equal(recipe.seasoning_count, 0);
    assert.equal(recipe.instruction_count, 0);

    await db`
      insert into public.ingredients (recipe_id, name, quantity)
      values (${recipeId}, '', '')
    `;
    const after = await counter(recipeId);
    assert.equal(after.ingredient_count, 1);
  });

  test("caps each child collection at the shared maximum", async () => {
    const recipeId = await insertRecipe();

    await fill("ingredients", recipeId, LIST_LIMIT);
    await fill("seasonings", recipeId, LIST_LIMIT);
    await fill("instructions", recipeId, LIST_LIMIT);

    const full = await counter(recipeId);
    assert.equal(full.ingredient_count, LIST_LIMIT);
    assert.equal(full.seasoning_count, LIST_LIMIT);
    assert.equal(full.instruction_count, LIST_LIMIT);

    const ingredient = await messageOf(() =>
      db`
        insert into public.ingredients (recipe_id, name, quantity)
        values (${recipeId}, 'extra', '1')
      `,
    );
    const seasoning = await messageOf(() =>
      db`
        insert into public.seasonings (recipe_id, name, quantity)
        values (${recipeId}, 'extra', '1')
      `,
    );
    const instruction = await messageOf(() =>
      db`
        insert into public.instructions (recipe_id, step_number, description)
        values (${recipeId}, 99, 'extra')
      `,
    );

    assert.match(ingredient, /ingredients for recipe .* must stay between 0 and 50/);
    assert.match(seasoning, /seasonings for recipe .* must stay between 0 and 50/);
    assert.match(instruction, /instructions for recipe .* must stay between 0 and 50/);

    const after = await counter(recipeId);
    assert.equal(after.ingredient_rows, LIST_LIMIT);
    assert.equal(after.seasoning_rows, LIST_LIMIT);
    assert.equal(after.instruction_rows, LIST_LIMIT);
  });

  test("rolls back a bulk insert that would pass the cap", async () => {
    const recipeId = await insertRecipe();
    const error = await messageOf(() =>
      fill("ingredients", recipeId, LIST_LIMIT + 1),
    );

    assert.match(error, /must stay between 0 and 50/);
    const after = await counter(recipeId);
    assert.equal(after.ingredient_count, 0);
    assert.equal(after.ingredient_rows, 0);
  });

  test("rolls back every row when one recipe in a bulk write is full", async () => {
    const fullId = await insertRecipe("Full");
    const emptyId = await insertRecipe("Empty");

    await fill("ingredients", fullId, LIST_LIMIT);
    const error = await messageOf(() =>
      db`
        insert into public.ingredients (recipe_id, name, quantity)
        values (${fullId}, 'extra', '1'), (${emptyId}, 'first', '1')
      `,
    );

    assert.match(error, /must stay between 0 and 50/);
    assert.equal((await counter(fullId)).ingredient_rows, LIST_LIMIT);
    assert.equal((await counter(emptyId)).ingredient_rows, 0);
  });

  test("allows the app replace pattern and rolls it back over the cap", async () => {
    const recipeId = await insertRecipe();

    await fill("ingredients", recipeId, 2);
    await db.begin(async (tx) => {
      await tx`delete from public.ingredients where recipe_id = ${recipeId}`;
      await tx`
        insert into public.ingredients (recipe_id, name, quantity)
        select ${recipeId}, 'fresh', g::text
        from generate_series(1, ${LIST_LIMIT}) as g
      `;
    });
    assert.equal((await counter(recipeId)).ingredient_count, LIST_LIMIT);

    const error = await messageOf(() =>
      db.begin(async (tx) => {
        await tx`delete from public.ingredients where recipe_id = ${recipeId}`;
        await tx`
          insert into public.ingredients (recipe_id, name, quantity)
          select ${recipeId}, 'too-many', g::text
          from generate_series(1, ${LIST_LIMIT + 1}) as g
        `;
      }),
    );

    assert.match(error, /must stay between 0 and 50/);
    const after = await counter(recipeId);
    assert.equal(after.ingredient_count, LIST_LIMIT);
    assert.equal(after.ingredient_rows, LIST_LIMIT);
  });

  test("moves a child until the destination would pass the cap", async () => {
    const sourceId = await insertRecipe("Source");
    const destinationId = await insertRecipe("Destination");

    await fill("ingredients", sourceId, LIST_LIMIT);
    await fill("ingredients", destinationId, LIST_LIMIT);
    const error = await messageOf(() =>
      db`
        update public.ingredients
        set recipe_id = ${destinationId}
        where id = (
          select min(id) from public.ingredients where recipe_id = ${sourceId}
        )
      `,
    );

    assert.match(error, /must stay between 0 and 50/);
    assert.equal((await counter(sourceId)).ingredient_rows, LIST_LIMIT);
    assert.equal((await counter(destinationId)).ingredient_rows, LIST_LIMIT);

    await db`
      delete from public.ingredients
      where id = (
        select min(id) from public.ingredients where recipe_id = ${destinationId}
      )
    `;
    await db`
      update public.ingredients
      set recipe_id = ${destinationId}
      where id = (
        select min(id) from public.ingredients where recipe_id = ${sourceId}
      )
    `;

    assert.equal((await counter(sourceId)).ingredient_count, LIST_LIMIT - 1);
    assert.equal((await counter(destinationId)).ingredient_count, LIST_LIMIT);
    assert.equal((await counter(sourceId)).ingredient_rows, LIST_LIMIT - 1);
    assert.equal((await counter(destinationId)).ingredient_rows, LIST_LIMIT);
  });

  test("renames a child without changing the counter", async () => {
    const recipeId = await insertRecipe();

    await fill("seasonings", recipeId, LIST_LIMIT);
    await db`
      update public.seasonings
      set name = 'renamed'
      where id = (
        select min(id) from public.seasonings where recipe_id = ${recipeId}
      )
    `;
    const after = await counter(recipeId);
    assert.equal(after.seasoning_count, LIST_LIMIT);
    assert.equal(after.seasoning_rows, LIST_LIMIT);
  });

  test("deleting a recipe removes its counter and children", async () => {
    const recipeId = await insertRecipe();

    await fill("ingredients", recipeId, 3);
    await db`delete from public.recipes where id = ${recipeId}`;
    const [children] = await db`
      select count(*)::int as count
      from public.ingredients
      where recipe_id = ${recipeId}
    `;
    const [counters] = await db`
      select count(*)::int as count
      from recipe_guard.recipe_collection_counts
      where recipe_id = ${recipeId}
    `;
    assert.equal(children.count, 0);
    assert.equal(counters.count, 0);
  });

  test("rejects direct counter writes and API access to the counter", async () => {
    const recipeId = await insertRecipe();
    const direct = await messageOf(() =>
      db`
        update recipe_guard.recipe_collection_counts
        set ingredient_count = 0
        where recipe_id = ${recipeId}
      `,
    );
    assert.match(direct, /maintained by the database/);

    const asMember = await messageOf(() =>
      db.begin(async (tx) => {
        await tx`set local role authenticated`;
        await tx`select set_config('request.jwt.claim.sub', ${ownerId}, true)`;
        await tx`select * from recipe_guard.recipe_collection_counts`;
      }),
    );
    assert.match(asMember, /permission denied/);
  });

  test("blocks a cross-user child write and allows the owner", async () => {
    const recipeId = await insertRecipe();
    const denied = await messageOf(() =>
      db.begin(async (tx) => {
        await tx`set local role authenticated`;
        await tx`select set_config('request.jwt.claim.sub', ${otherId}, true)`;
        await tx`
          insert into public.ingredients (recipe_id, name, quantity)
          values (${recipeId}, 'stolen', '1')
        `;
      }),
    );

    assert.match(denied, /not available for this write/);
    assert.equal((await counter(recipeId)).ingredient_count, 0);

    await db.begin(async (tx) => {
      await tx`set local role authenticated`;
      await tx`select set_config('request.jwt.claim.sub', ${ownerId}, true)`;
      await tx`
        insert into public.ingredients (recipe_id, name, quantity)
        values (${recipeId}, 'mine', '1')
      `;
    });
    assert.equal((await counter(recipeId)).ingredient_count, 1);
  });

  test("rejects an API role with no JWT subject", async () => {
    const recipeId = await insertRecipe();
    const authenticator = postgres({
      host: socketDir,
      port,
      username: "authenticator",
      database: "recipe_limits",
      max: 1,
    });

    try {
      const error = await messageOf(() =>
        authenticator.begin(async (tx) => {
          await tx`set local role authenticated`;
          await tx`
            insert into public.ingredients (recipe_id, name, quantity)
            values (${recipeId}, 'no-subject', '1')
          `;
        }),
      );
      assert.match(error, /not available for this write/);
    } finally {
      await authenticator.end();
    }

    assert.equal((await counter(recipeId)).ingredient_rows, 0);
  });

  test("serializes overlapping inserts so the cap cannot be passed", async () => {
    const recipeId = await insertRecipe();

    await fill("ingredients", recipeId, LIST_LIMIT - 1);

    const first = db.begin(async (tx) => {
      await tx`
        insert into public.ingredients (recipe_id, name, quantity)
        values (${recipeId}, 'first', '1')
      `;
      await tx`select pg_sleep(0.4)`;
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    const started = Date.now();
    const second = messageOf(() =>
      db`
        insert into public.ingredients (recipe_id, name, quantity)
        values (${recipeId}, 'second', '1')
      `,
    );
    const [, secondMessage] = await Promise.all([first, second]);
    const elapsed = Date.now() - started;
    const after = await counter(recipeId);

    assert.match(secondMessage, /must stay between 0 and 50/);
    assert.equal(after.ingredient_count, LIST_LIMIT);
    assert.equal(after.ingredient_rows, LIST_LIMIT);
    assert.ok(elapsed >= 200, `second insert did not wait (${elapsed}ms)`);
  });

  test("accepts only ten of twenty parallel inserts once forty rows exist", async () => {
    const recipeId = await insertRecipe();

    await fill("ingredients", recipeId, LIST_LIMIT - 10);
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        messageOf(() =>
          db`
            insert into public.ingredients (recipe_id, name, quantity)
            values (${recipeId}, ${`burst-${index}`}, '1')
          `,
        ),
      ),
    );
    const successes = results.filter((result) => result === "").length;

    assert.equal(successes, 10);
    assert.equal((await counter(recipeId)).ingredient_count, LIST_LIMIT);
    assert.equal((await counter(recipeId)).ingredient_rows, LIST_LIMIT);
  });

  test("opposite child moves do not deadlock or desynchronise the counters", async () => {
    const firstId = await insertRecipe("First");
    const secondId = await insertRecipe("Second");

    await fill("ingredients", firstId, 10);
    await fill("ingredients", secondId, 10);

    await Promise.all([
      db.begin(async (tx) => {
        await tx`
          update public.ingredients
          set recipe_id = ${secondId}
          where id = (
            select id
            from public.ingredients
            where recipe_id = ${firstId}
            order by id
            limit 1
          )
        `;
      }),
      db.begin(async (tx) => {
        await tx`
          update public.ingredients
          set recipe_id = ${firstId}
          where id = (
            select id
            from public.ingredients
            where recipe_id = ${secondId}
            order by id
            limit 1
          )
        `;
      }),
    ]);

    const first = await counter(firstId);
    const second = await counter(secondId);
    assert.equal(first.ingredient_count, 10);
    assert.equal(first.ingredient_rows, 10);
    assert.equal(second.ingredient_count, 10);
    assert.equal(second.ingredient_rows, 10);
  });

  test("opposite multi-recipe inserts stay within the cap", async () => {
    const lowId = await insertRecipe("Low");
    const highId = await insertRecipe("High");

    assert.ok(lowId < highId);
    await fill("ingredients", lowId, LIST_LIMIT - 1);
    await fill("ingredients", highId, LIST_LIMIT - 1);

    const insertPair = (firstId: number, secondId: number) => {
      return messageOf(() =>
        db.begin(async (tx) => {
          await tx`set local deadlock_timeout = '100ms'`;
          await tx`
            insert into public.ingredients (recipe_id, name, quantity)
            values (${firstId}, 'a', '1'), (${secondId}, 'b', '1')
          `;
        }),
      );
    };

    await Promise.all([
      insertPair(lowId, highId),
      insertPair(highId, lowId),
    ]);
    const low = await counter(lowId);
    const high = await counter(highId);

    assert.equal(low.ingredient_count, high.ingredient_count);
    assert.ok(
      low.ingredient_count === LIST_LIMIT ||
        low.ingredient_count === LIST_LIMIT - 1,
    );
    assert.equal(low.ingredient_count, low.ingredient_rows);
    assert.equal(high.ingredient_count, high.ingredient_rows);
  });

  test("one of two overlapping bulk inserts that would land on the cap commits", async () => {
    const recipeId = await insertRecipe();

    await fill("ingredients", recipeId, LIST_LIMIT - 15);
    const bulk = (label: string) => {
      return messageOf(() =>
        db.begin(async (tx) => {
          await tx`
            insert into public.ingredients (recipe_id, name, quantity)
            select ${recipeId}, ${label}, g::text
            from generate_series(1, 15) as g
          `;
          await tx`select pg_sleep(0.2)`;
        }),
      );
    };
    const results = await Promise.all([bulk("a"), bulk("b")]);
    const successes = results.filter((result) => result === "").length;

    assert.equal(successes, 1);
    assert.equal((await counter(recipeId)).ingredient_count, LIST_LIMIT);
    assert.equal((await counter(recipeId)).ingredient_rows, LIST_LIMIT);
  });

  test("the app create and update queries honour the cap", async () => {
    const { createRecipe, updateRecipe } = await import("./queries/recipes");
    const quantity = (count: number) => {
      return Array.from({ length: count }, (_, index) => ({
        name: `item ${index}`,
        quantity: "1",
      }));
    };
    const input = (count: number) => ({
      title: "From the app",
      description: "Saved by the query",
      ingredients: quantity(count),
      seasonings: quantity(1),
      instructions: [{ description: "Cook" }],
    });

    const createdId = await createRecipe(ownerId, input(2));
    assert.equal((await counter(createdId)).ingredient_count, 2);

    const updatedId = await updateRecipe(createdId, ownerId, input(LIST_LIMIT));
    assert.equal(updatedId, createdId);
    assert.equal((await counter(createdId)).ingredient_count, LIST_LIMIT);

    const overflow = await messageOf(() =>
      updateRecipe(createdId, ownerId, input(LIST_LIMIT + 1)),
    );
    assert.match(overflow, /must stay between 0 and 50/);
    assert.equal((await counter(createdId)).ingredient_rows, LIST_LIMIT);

    const before = await db`select count(*)::int as count from public.recipes`;
    const createOverflow = await messageOf(() =>
      createRecipe(ownerId, input(LIST_LIMIT + 1)),
    );
    const after = await db`select count(*)::int as count from public.recipes`;

    assert.match(createOverflow, /must stay between 0 and 50/);
    assert.equal(after[0].count, before[0].count);
  });

  test("stores a title of 255 emoji, matching the form's code-point count", async () => {
    const title = "🍜".repeat(TEXT_LIMIT);

    assert.equal(title.length, TEXT_LIMIT * 2);
    const recipeId = await insertRecipe(title, "Warm");
    const [row] = await db`
      select char_length(title)::int as length
      from public.recipes
      where id = ${recipeId}
    `;
    assert.equal(row.length, TEXT_LIMIT);
  });

  test("migrates existing rows on the boundary and refuses rows over it", async () => {
    await createDatabase("recipe_limits_boundary");
    await applyMigrationFile("recipe_limits_boundary", "20261112122015_baseline");
    await applyMigrationFile(
      "recipe_limits_boundary",
      "20261112122305_ownership_and_rls",
    );

    const boundary = open("recipe_limits_boundary");

    try {
      await boundary`
        insert into auth.users (id) values (${ownerId}::uuid)
      `;
      const [recipe] = await boundary`
        insert into public.recipes (user_id, title, description)
        values (${ownerId}::uuid, 'Boundary', ${"a".repeat(DESCRIPTION_LIMIT)})
        returning id
      `;
      const recipeId = recipe.id as number;

      await boundary`
        insert into public.ingredients (recipe_id, name, quantity)
        select ${recipeId}, 'item', g::text
        from generate_series(1, ${LIST_LIMIT}) as g
      `;
      await boundary`
        insert into public.seasonings (recipe_id, name, quantity)
        select ${recipeId}, 'item', g::text
        from generate_series(1, ${LIST_LIMIT}) as g
      `;
      await boundary`
        insert into public.instructions (recipe_id, step_number, description)
        select ${recipeId}, g, ${"a".repeat(INSTRUCTION_LIMIT)}
        from generate_series(1, ${LIST_LIMIT}) as g
      `;
      await applyMigrationFile(
        "recipe_limits_boundary",
        "20261120062415_recipe_validation",
      );

      const [counts] = await boundary`
        select ingredient_count, seasoning_count, instruction_count
        from recipe_guard.recipe_collection_counts
        where recipe_id = ${recipeId}
      `;
      assert.equal(counts.ingredient_count, LIST_LIMIT);
      assert.equal(counts.seasoning_count, LIST_LIMIT);
      assert.equal(counts.instruction_count, LIST_LIMIT);

      const extra = await messageOf(() =>
        boundary`
          insert into public.ingredients (recipe_id, name, quantity)
          values (${recipeId}, 'extra', '1')
        `,
      );
      assert.match(extra, /must stay between 0 and 50/);
    } finally {
      await boundary.end();
    }

    await createDatabase("recipe_limits_preflight");
    await applyMigrationFile(
      "recipe_limits_preflight",
      "20261112122015_baseline",
    );
    await applyMigrationFile(
      "recipe_limits_preflight",
      "20261112122305_ownership_and_rls",
    );
    const preflight = open("recipe_limits_preflight");
    let recipeId = 0;

    try {
      await preflight`
        insert into auth.users (id) values (${ownerId}::uuid)
      `;
      const [recipe] = await preflight`
        insert into public.recipes (user_id, title, description)
        values (${ownerId}::uuid, 'Too long', ${"a".repeat(DESCRIPTION_LIMIT + 1)})
        returning id
      `;
      recipeId = recipe.id as number;
      await preflight`
        insert into public.ingredients (recipe_id, name, quantity)
        select ${recipeId}, 'item', g::text
        from generate_series(1, ${LIST_LIMIT + 1}) as g
      `;
      await preflight`
        insert into public.seasonings (recipe_id, name, quantity)
        select ${recipeId}, 'item', g::text
        from generate_series(1, ${LIST_LIMIT + 1}) as g
      `;
      await preflight`
        insert into public.instructions (recipe_id, step_number, description)
        select
          ${recipeId},
          g,
          case when g = 1 then ${"a".repeat(INSTRUCTION_LIMIT + 1)} else 'Step' end
        from generate_series(1, ${LIST_LIMIT + 1}) as g
      `;
    } finally {
      await preflight.end();
    }

    const refusal = await messageOf(() =>
      applyMigrationFile(
        "recipe_limits_preflight",
        "20261120062415_recipe_validation",
      ),
    );

    assert.match(refusal, /refused to change existing data/);
    assert.match(refusal, /does not truncate or delete/);

    const check = open("recipe_limits_preflight");

    try {
      const [recipe] = await check`
        select char_length(description)::int as length
        from public.recipes
        where id = ${recipeId}
      `;
      const [ingredients] = await check`
        select count(*)::int as count
        from public.ingredients
        where recipe_id = ${recipeId}
      `;
      const schemas = await check`
        select nspname
        from pg_namespace
        where nspname = 'recipe_guard'
      `;

      assert.equal(recipe.length, DESCRIPTION_LIMIT + 1);
      assert.equal(ingredients.count, LIST_LIMIT + 1);
      assert.equal(schemas.length, 0);
    } finally {
      await check.end();
    }
  });

  afterAll(async () => {
    if (process.env.DATABASE_URL?.includes("recipe_limits")) {
      const imported = await import("./index");
      await imported.db.$client.end();
    }

    const clients = [db, admin].filter(Boolean);

    await Promise.all(clients.map((client) => client.end()));

    if (dataDir && existsSync(path.join(dataDir, "postmaster.pid"))) {
      execFileSync(path.join(binDir, "pg_ctl"), [
        "-D",
        dataDir,
        "-w",
        "-m",
        "immediate",
        "stop",
      ]);
    }

    if (dataDir) {
      rmSync(dataDir, { recursive: true, force: true });
    }

    if (socketDir) {
      rmSync(socketDir, { recursive: true, force: true });
    }
  }, 30_000);
});
