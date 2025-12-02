import os
import datetime
import pymysql
import flask

# Cargar variables de entorno de la BD
DB_NAME = os.getenv("MYSQL_DATABASE")
DB_USER = os.getenv("MYSQL_USER")
DB_PASS = os.getenv("MYSQL_PASSWORD")
DB_HOST = os.getenv("MYSQL_HOST")
DB_PORT = int(os.getenv("MYSQL_PORT"))

# Configurar Flask
app = flask.Flask(__name__)
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

def enviarConsulta(sql, param=None):
    '''Envía una consulta SQL a la base de datos y devuelve las filas.
    Son listas de diccionarios.'''
    try:
        with conectarBD() as conexion:
            with conexion.cursor() as cursor:
                cursor.execute(sql, param) # Consulta
                filas = cursor.fetchall()
                return filas
    except Exception as e:
        return {"error": str(e)}, 500

def obtenerDatosUsuario(udni):
    '''Obtiene los datos de un usuario salvo su uid'''
    sql = "SELECT * FROM Usuarios WHERE udni = %s"
    filas = enviarConsulta(sql, udni)
    
    if not filas:
        return {"error": "Usuario no encontrado"}, 404
    #eliminamos el uid de la respuesta por seguridad
    for fila in filas:
        fila.pop("uid", None)
    return filas

def obtenerDatosEmpresa(nombre):
    '''Obtiene los datos de una empresa salvo su eid'''
    sql = "SELECT * FROM Empresas WHERE nombre = %s"
    filas = enviarConsulta(sql, nombre)

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
    resultado = enviarConsulta(sql, param)

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

@app.route('/login', methods=['GET'])
def end_login():
    datos = flask.request.get_json() # obtener la contraseña del usuario
    sql = "SELECT contrasena FROM Usuarios WHERE udni = %s" 
    filas = enviarConsulta(sql, datos.get("udni"))

    if not filas:                    # comprobamos que haya datos
        return {"error": "Usuario no encontrado"}, 404

    if filas[0]['contrasena'] == datos.get("contrasena"): # comprobar contraseña
        sql = "SELECT nombre, monedero FROM Usuarios WHERE udni = %s"
        filas = enviarConsulta(sql, datos.get("udni"))
        return flask.jsonify(filas)

    return {"error": "Contraseña incorrecta"}, 404

@app.route('/inicio', methods=['GET'])
def end_inicio():
    datos = flask.request.get_json()    # obtener el monedero del usuario
    sql = "SELECT monedero FROM Usuarios WHERE udni = %s"
    filas = enviarConsulta(sql, datos.get("udni"))
    return flask.jsonify(filas)

@app.route('/registro', methods=['POST'])
def end_registro():
    datos = flask.request.get_json()

    sql= "SELECT * FROM Usuarios WHERE email = %s" # comprobar si ya existe el usuario
    filas = enviarConsulta(sql, datos.get("email"))
    if filas:
        return {"error": "El usuario ya existe"}, 404
    
    # insertar nuevo usuario
    sql = "INSERT INTO Usuarios (email, nombre, contrasena) VALUES (%s, %s, %s)"
    param = (datos.get("email"), datos.get("nombre"), datos.get("contrasena"))
    filas = enviarConsulta(sql, param)
    return flask.jsonify(filas)


##* Ejecutar la app *###
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)