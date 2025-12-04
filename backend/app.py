import os
import datetime
import pymysql
import flask
from flask_cors import CORS
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta

# Cargar variables de entorno de la BD
DB_NAME = os.getenv("MYSQL_DATABASE")
DB_USER = os.getenv("MYSQL_USER")
DB_PASS = os.getenv("MYSQL_PASSWORD")
DB_HOST = os.getenv("MYSQL_HOST")
DB_PORT = int(os.getenv("MYSQL_PORT"))
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key_change_in_production")  


# Configurar Flask
app = flask.Flask(__name__)
CORS(app)
app.json.ensure_ascii = False


###* Funciones *###
def conectarBD():
    '''Crea y devuelve una conexión a la base de datos.
        Se cierra al salir del contexto with'''
    return pymysql.connect(
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor
    )

def normalizarHoras(filas):
    '''Convierte los campos de tipo hora a formato legible'''
    for fila in filas:                      # normalizamos las horas
        for k, v in list(fila.items()):     # por cada par clave-valor
            if isinstance(v, datetime.timedelta):   # si es hora
                fila[k] = str(v)                    # la convertimos a horas legibles

def enviarSelect(sql, param=None):
    '''Envía una consulta Select a la base de datos y devuelve las filas.
    Son listas de diccionarios.'''
    try:
        with conectarBD() as conexion:
            with conexion.cursor() as cursor:
                cursor.execute(sql, param) # Consulta
                filas = cursor.fetchall()
                return filas
    except Exception as e:
        return {"error": str(e)}, 500

def enviarCommit(sql, param=None):
    """Ejecuta una consulta que modifica la BD, hace commit y devuelve lastrowid."""
    with conectarBD() as conexion:
        with conexion.cursor() as cursor:
            cursor.execute(sql, param)
            lastid = cursor.lastrowid
        conexion.commit()
    return lastid

def obtenerDatosUsuario(udni):
    '''Obtiene los datos de un usuario salvo su uid'''
    sql = "SELECT * FROM Usuarios WHERE udni = %s"
    filas = enviarSelect(sql, udni)

    if not filas:
        return {"error": "Usuario no encontrado"}, 404
    #eliminamos el uid de la respuesta por seguridad
    for fila in filas:
        fila.pop("uid", None)
    return filas

def obtenerDatosEmpresa(nombre):
    '''Obtiene los datos de una empresa salvo su eid'''
    sql = "SELECT * FROM Empresas WHERE nombre = %s"
    filas = enviarSelect(sql, nombre)

    if not filas: # comprobamos que haya datos, si no 404
        return {"error": "Empresa no encontrada"}, 404

    normalizarHoras(filas)
    # eliminamos el eid de la respuesta por seguridad
    for fila in filas:
        fila.pop("eid", None)
    return filas


###* Endpoints *###
@app.route('/health', methods=['GET'])
def health_check():
    return {"status": "healthy"}, 200

#! Para debug ******
@app.route('/consulta', methods=['POST'])
def end_consulta():
    datos = flask.request.get_json()
    sql = datos.get("sql")
    param = datos.get("param")
    resultado = enviarSelect(sql, param)

    normalizarHoras(resultado)

    return flask.jsonify(resultado)
#! ****************
#? EJEMPLOS ********
@app.route('/usuario/<string:uid>', methods=['GET'])
def end_obtenerUsuario(uid):
    """Obtiene datos de usuario (sin contraseña)"""
    try:
        filas = enviarSelect("SELECT uid, udni, nombre, apellidos FROM Usuarios WHERE udni = %s", (uid,))
    except Exception:
        return {"error": "Error en la base de datos"}, 500

    if not filas:
        return {"error": "Usuario no encontrado"}, 404

    return flask.jsonify(filas[0])

@app.route('/empresa/<string:nombre>', methods=['GET'])
def end_obtenerEmpresa(nombre):
    empresa = obtenerDatosEmpresa(nombre)
    return flask.jsonify(empresa)
#? EJEMPLOS ********

@app.route('/login', methods=['POST'])
def end_login():

    datos = flask.request.get_json() or {}

    udni = datos.get('udni')
    password = datos.get('password') or datos.get('contrasena')

    if not all([udni, password]):
        return {"error": "Faltan credenciales: udni, password"}, 400

    try:
        filas = enviarSelect("SELECT uid, udni, nombre, apellidos, contrasena FROM Usuarios WHERE udni = %s", (udni,))
    except Exception:
        return {"error": "Error en la base de datos"}, 500


    if not filas:
        return {"error": "Usuario no encontrado"}, 404

    user = filas[0]
    if not check_password_hash(user['contrasena'], password):
        return {"error": "Credenciales inválidas"}, 401

    payload = {
        "user_id": user.get("uid"),
        "udni": user.get("udni"),
        "exp": datetime.datetime.utcnow() + timedelta(hours=24)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

    return {
        "token": token,
        "user": {
            "uid": user.get("uid"),
            "udni": user.get("udni"),
            "nombre": user.get("nombre"),
            "apellidos": user.get("apellidos")
        }
    }, 200

@app.route('/inicio', methods=['GET'])
def end_inicio():
    datos = flask.request.get_json()    # obtener el monedero del usuario
    sql = "SELECT monedero FROM Usuarios WHERE udni = %s"
    filas = enviarSelect(sql, datos.get("udni"))
    return flask.jsonify(filas)

@app.route('/register', methods=['POST'])
def end_registro():
    datos = flask.request.get_json() or {}


    # Mapear campos del frontend a BD (nombre, apellidos, udni, password)
    udni = datos.get('udni')
    nombre = datos.get('nombre')
    apellidos = datos.get('apellidos')
    password = datos.get('password') or datos.get('contrasena')

    if not all([udni, nombre, apellidos, password]):
        return {"error": "Faltan campos: udni, nombre, apellidos, password"}, 400

    # Comprobar existencia por udni
    try:
        existente = enviarSelect("SELECT 1 FROM Usuarios WHERE udni = %s", (udni,))
    except Exception:
        app.logger.exception("Error SELECT Usuarios")
        return {"error": "Error en la base de datos"}, 500

    if existente:
        return {"error": "El udni ya está registrado"}, 409

    hashed = generate_password_hash(password)

    try:
        lastid = enviarCommit(
            "INSERT INTO Usuarios (udni, nombre, apellidos, contrasena, monedero, nivel_de_juego, valoracion) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (udni, nombre, apellidos, hashed, 0.00, 'F', 0.0)
        )
        return {"message": "Usuario creado", "id": lastid}, 201
    except Exception:
        app.logger.exception("Error insert Usuarios")
        return {"error": "Error al crear usuario"}, 500



##* Ejecutar la app *###
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)