"""Utility script: creates the polla_db database if it does not exist yet."""
import psycopg

try:
    conn = psycopg.connect("postgresql://postgres:root@localhost:5432/postgres")
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname = 'polla_db'")
    if cur.fetchone():
        print("La base de datos 'polla_db' ya existe.")
    else:
        cur.execute("CREATE DATABASE polla_db")
        print("Base de datos 'polla_db' creada exitosamente.")
    conn.close()
except Exception as e:
    print(f"ERROR al conectar a PostgreSQL: {e}")
    print()
    print("Asegúrate de que:")
    print("  1. PostgreSQL está corriendo en localhost:5432")
    print("  2. El usuario 'postgres' existe con contraseña 'postgres'")
    print("     (o edita el archivo .env y este script con tus credenciales reales)")
