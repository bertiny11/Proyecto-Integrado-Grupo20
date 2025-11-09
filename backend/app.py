import os
import pymysql.cursors
import time

# Esperar a la BD
time.sleep(5)

# Datos de las variables de entorno para conectarse a la BD
connection = pymysql.connect(
    database=os.getenv("MYSQL_DATABASE"),
    user=os.getenv("MYSQL_USER"),
    password=os.getenv("MYSQL_PASSWORD"),
    host=os.getenv("MYSQL_HOST"),
    port=int(os.getenv("MYSQL_PORT")),
    charset="utf8mb4",
    cursorclass=pymysql.cursors.DictCursor
)

# Conexión
with connection:
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM Usuarios;") # Consulta
        usuarios = cursor.fetchall()
        print("Usuarios:")
        for u in usuarios:
            print(f"- {u['uid']}, {u['udni']}, {u['contrasena']}, {u['nombre']}, {u['apellidos']}, {u['monedero']}, {u['nivel_de_juego']}, {u['valoracion']}")
