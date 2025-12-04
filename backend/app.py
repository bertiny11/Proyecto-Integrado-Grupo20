import os
import datetime
import pymysql
import flask
from flask_cors import CORS
import jwt
from datetime import timedelta

# Cargar variables de entorno de la BD
DB_NAME = os.getenv("MYSQL_DATABASE")
DB_USER = os.getenv("MYSQL_USER")
DB_PASS = os.getenv("MYSQL_PASSWORD")
DB_HOST = os.getenv("MYSQL_HOST")
DB_PORT = int(os.getenv("MYSQL_PORT"))
HASH_KEY = os.getenv("HASH_KEY")

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
    try:
        with conectarBD() as conexion:
            with conexion.cursor() as cursor:
                cursor.execute(sql, param)
                lastid = cursor.lastrowid
            conexion.commit()
        return lastid
    except Exception as e:
        return {"error": str(e)}, 500

#? EJEMPLOS ********
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
#? EJEMPLOS ********

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
    usuario = obtenerDatosUsuario(uid)
    return flask.jsonify(usuario)

@app.route('/empresa/<string:nombre>', methods=['GET'])
def end_obtenerEmpresa(nombre):
    empresa = obtenerDatosEmpresa(nombre)
    return flask.jsonify(empresa)
#? EJEMPLOS ********


@app.route('/login', methods=['POST'])
def end_login():
    datos = flask.request.get_json()
    udni = datos.get('udni')
    contrasena = datos.get('password') or datos.get('contrasena')

    if not all([udni, contrasena]):
        return {"error": "Faltan datos"}, 400

    filas = enviarSelect("SELECT uid, nombre, apellidos, contrasena, monedero FROM Usuarios WHERE udni = %s", udni)

    if not filas:
        return {"error": "Usuario no encontrado"}, 404

    usuario = filas[0] # no funciona el hash por ahora
        # if not check_password_hash(usuario['contrasena'], contrasena):
        #     return {"error": "Credenciales inválidas"}, 401

    if not usuario['contrasena'] == contrasena:
        return {"error": "Credenciales inválidas"}, 401

    payload = {
        "udni": usuario.get("udni"),
        "exp": datetime.datetime.utcnow() + timedelta(hours=24)
    }
    try:
        token = jwt.encode(payload, HASH_KEY, algorithm='HS256')
    except Exception:
        return {"error": "Error al generar el token"}, 500

    return {
        "token": token,
        "user": {
            "udni": usuario.get("udni"),
            "nombre": usuario.get("nombre"),
            "apellidos": usuario.get("apellidos"),
            "monedero": usuario.get("monedero")
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
    datos = flask.request.get_json()
    udni = datos.get('udni')
    contrasena = datos.get('password') or datos.get('contrasena')
    nombre = datos.get('nombre')
    apellidos = datos.get('apellidos')

    # Comprobamos que esten todos los datos
    if not all([udni, contrasena, nombre, apellidos]):
        return {"error": "Faltan datos"}, 400

    # Comprobamos que no exista el usuario
    existente = enviarSelect("SELECT 1 FROM usuarios WHERE udni = %s", udni)

    if existente:
        return {"error": "Usuario ya registrado"}, 

    # hashed = generate_password_hash(contrasena)

    enviarCommit(
        "INSERT INTO usuarios (udni, contrasena, nombre, apellidos) VALUES (%s, %s, %s, %s)",
        (udni, contrasena, nombre, apellidos))
    return {"message": "Usuario creado"}, 201



##* Ejecutar la app *###
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)