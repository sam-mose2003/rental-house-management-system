import os
from pathlib import Path

import MySQLdb


def _split_sql_statements(sql_text: str) -> list[str]:
    statements: list[str] = []
    buff: list[str] = []
    in_single = False
    in_double = False

    for ch in sql_text:
        if ch == "'" and not in_double:
            in_single = not in_single
        elif ch == '"' and not in_single:
            in_double = not in_double

        if ch == ";" and not in_single and not in_double:
            stmt = "".join(buff).strip()
            buff = []
            if stmt:
                statements.append(stmt)
            continue
        buff.append(ch)

    tail = "".join(buff).strip()
    if tail:
        statements.append(tail)
    return statements


def main() -> None:
    mysql_host = os.getenv("MYSQL_HOST", "localhost")
    mysql_user = os.getenv("MYSQL_USER", "root")
    mysql_password = os.getenv("MYSQL_PASSWORD", "")
    mysql_db = os.getenv("MYSQL_DB", "rhms")
    mysql_port = int(os.getenv("MYSQL_PORT", "3306"))

    schema_path = Path(__file__).with_name("schema.sql")
    schema = schema_path.read_text(encoding="utf-8")

    # Create DB first (connect without selecting a DB)
    conn = MySQLdb.connect(
        host=mysql_host,
        user=mysql_user,
        passwd=mysql_password,
        port=mysql_port,
        charset="utf8mb4",
    )
    try:
        cur = conn.cursor()
        cur.execute(
            f"CREATE DATABASE IF NOT EXISTS `{mysql_db}` DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci"
        )
        conn.commit()
    finally:
        conn.close()

    # Now apply schema inside the DB
    conn = MySQLdb.connect(
        host=mysql_host,
        user=mysql_user,
        passwd=mysql_password,
        db=mysql_db,
        port=mysql_port,
        charset="utf8mb4",
    )
    try:
        cur = conn.cursor()
        # If a previous init partially created tables, drop them so we can apply
        # schema changes (like adding ENGINE/foreign keys) deterministically.
        cur.execute("SET FOREIGN_KEY_CHECKS=0")
        for table in ("payments", "maintenance", "tenants", "houses"):
            cur.execute(f"DROP TABLE IF EXISTS `{table}`")
        cur.execute("SET FOREIGN_KEY_CHECKS=1")

        for stmt in _split_sql_statements(schema):
            s = stmt.strip()
            if not s or s.startswith("--"):
                continue
            cur.execute(s)
        conn.commit()
    finally:
        conn.close()

    print(f"OK: initialized MySQL database '{mysql_db}' using {schema_path.name}")


if __name__ == "__main__":
    main()

