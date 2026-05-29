import psycopg

conn = psycopg.connect("postgresql://postgres:root@localhost:5432/polla_db")
cur = conn.cursor()
cur.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")
tables = [r[0] for r in cur.fetchall()]
print("Tablas en polla_db:", tables)
conn.close()
