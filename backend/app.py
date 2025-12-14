import os
import datetime
from datetime import timedelta
import pymysql
import flask
from flask_cors import CORS
import jwt
import bcrypt

# Cargar variables de entorno de la BD
DB_NAME = os.getenv("MYSQL_DATABASE")
DB_USER = os.getenv("MYSQL_USER")
DB_PASS = os.getenv("MYSQL_PASSWORD")
DB_HOST = os.getenv("MYSQL_HOST")
DB_PORT = int(os.getenv("MYSQL_PORT"))
HASH_KEY = os.getenv("HASH_KEY").encode()

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

def hashContrasena(password):
    """Devuelve el hash de la contrasena"""
    pwd = (HASH_KEY + password.encode()) # Combinamos la clave y la contrasena
    hashed = bcrypt.hashpw(pwd, bcrypt.gensalt())
    return hashed.decode()

def verificarContrasena(password, hashed):
    """Comprueba si la contraseña coincide."""
    pwd = (HASH_KEY + password.encode())
    return bcrypt.checkpw(pwd, hashed.encode())

def calcularValoracion(udni):
    """Calcula y actualiza la valoración media de un usuario."""
    sql = """SELECT ROUND(AVG(v.valoracion), 2) AS valoracion_media
        FROM Valoraciones v
        JOIN Usuarios u ON v.evaluado = u.uid
        WHERE u.udni = %s;"""
    filas = enviarSelect(sql, udni) # obtenemos la valoración media

    if filas[0]['valoracion_media'] is not None: # si hay valoraciones
        valoracion_media = float(filas[0]['valoracion_media'])
        sql_update = "UPDATE Usuarios SET valoracion = %s WHERE udni = %s" # actualizamos
        return enviarCommit(sql_update, (valoracion_media, udni))
    
    else:   # si no hay valoraciones, la dejamos a 0
        sql_update = "UPDATE Usuarios SET valoracion = 0.0 WHERE udni = %s"
        return enviarCommit(sql_update, (udni,))

# #? EJEMPLOS ********
# def obtenerDatosUsuario(udni):
#     '''Obtiene los datos de un usuario salvo su uid'''
#     sql = "SELECT * FROM Usuarios WHERE udni = %s"
#     filas = enviarSelect(sql, udni)

#     if not filas:
#         return {"error": "Usuario no encontrado"}, 404
#     #eliminamos el uid de la respuesta por seguridad
#     for fila in filas:
#         fila.pop("uid", None)
#     return filas

# def obtenerDatosEmpresa(nombre):
#     '''Obtiene los datos de una empresa salvo su eid'''
#     sql = "SELECT * FROM Empresas WHERE nombre = %s"
#     filas = enviarSelect(sql, nombre)

#     if not filas: # comprobamos que haya datos, si no 404
#         return {"error": "Empresa no encontrada"}, 404

#     normalizarHoras(filas)
#     # eliminamos el eid de la respuesta por seguridad
#     for fila in filas:
#         fila.pop("eid", None)
#     return filas
# #? EJEMPLOS ********

###* Endpoints *###
@app.route('/health', methods=['GET'])
def health_check():
    return {"status": "healthy"}, 200

# #! Para debug ******
# @app.route('/consulta', methods=['POST'])
# def end_consulta():
#     datos = flask.request.get_json()
#     sql = datos.get("sql")
#     param = datos.get("param")
#     resultado = enviarSelect(sql, param)

#     normalizarHoras(resultado)

#     return flask.jsonify(resultado)
# #! ****************

# #? EJEMPLOS ********
# @app.route('/usuario/<string:uid>', methods=['GET'])
# def end_obtenerUsuario(uid):
#     usuario = obtenerDatosUsuario(uid)
#     return flask.jsonify(usuario)

@app.route('/login', methods=['POST'])
def end_login():
    datos = flask.request.get_json()
    udni = datos.get('udni')
    contrasena = datos.get('password') or datos.get('contrasena')

    if not all([udni, contrasena]):
        return {"error": "Faltan datos"}, 400

    filas = enviarSelect("SELECT udni, nombre, apellidos, contrasena, monedero FROM Usuarios WHERE udni = %s", udni)

    if not filas:
        return {"error": "Usuario no encontrado"}, 404

    usuario = filas[0] # no funciona el hash por ahora
        # if not check_password_hash(usuario['contrasena'], contrasena):
        #     return {"error": "Credenciales inválidas"}, 401

    if not verificarContrasena(contrasena, usuario['contrasena']):
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
        return {"error": "Usuario ya registrado"}, 409

    # hashed = generate_password_hash(contrasena)

    enviarCommit(
        "INSERT INTO usuarios (udni, contrasena, nombre, apellidos) VALUES (%s, %s, %s, %s)",
        (udni, hashContrasena(contrasena), nombre, apellidos))
    return {"message": "Usuario creado"}, 201

@app.route('/reservas', methods=['POST'])
def end_ver_reservas():
    datos = flask.request.get_json()
    sql = """SELECT 
            u.udni,
            u.nombre,
            u.apellidos,
            pr.es_creador,
            pr.pagado,
            r.hora_inicio,
            r.duracion,
            r.nivel_de_juego,
            r.tipo,
            r.huecos_libres,
            r.estado,
            e.nombre AS empresa,
            r.rid
        FROM Usuarios u
        JOIN ParticipantesReserva pr ON u.uid = pr.usuario
        JOIN Reserva r ON pr.reserva = r.rid
        JOIN Pistas p ON r.pista = p.pid
        JOIN Empresas e ON p.empresa = e.eid
        WHERE u.udni = %s
        ORDER BY r.hora_inicio DESC;"""

    filas = enviarSelect(sql, [datos.get("udni")])

    if not filas:
        return {"Error": "No existen reservas para este usuario"}, 404
    
    normalizarHoras(filas)
    return flask.jsonify(filas)

@app.route('/modificarreserva', methods=['POST'])
def end_modificar_reserva():
    datos = flask.request.get_json()

    sql = """SELECT pr.es_creador
            FROM Reserva r JOIN ParticipantesReserva pr ON 
            r.rid = pr.reserva JOIN Usuarios u ON pr.usuario = u.uid 
            WHERE r.rid = %s AND pr.es_creador = 1 AND u.udni = %s;"""
    filas = enviarSelect(sql, [datos.get("rid"), datos.get("udni")])

    if not filas:
        return {"error": "Solo el creador de la reserva puede modificarla."}, 401

    sql = """UPDATE Reserva r
            JOIN ParticipantesReserva pr ON r.rid = pr.reserva
            JOIN Usuarios u ON pr.usuario = u.uid
            SET r.hora_inicio = %s,
                r.duracion = %s,
                r.nivel_de_juego = %s,
                r.tipo = %s,
                r.huecos_libres = %s,
                r.estado = %s
            WHERE u.udni = %s AND r.rid = %s AND pr.es_creador = 1;"""

    param = (datos.get("hora_inicio"), datos.get("duracion"), datos.get("nivel_de_juego"),
            datos.get("tipo"), datos.get("huecos_libres"), datos.get("estado"),
            datos.get("udni"), datos.get("rid"))
    
    resultado = enviarCommit(sql, param)
    return flask.jsonify(resultado)

@app.route('/actualizarmonedero', methods=['POST'])
def end_actualizar_monedero():
    datos = flask.request.get_json()
    udni = datos.get("udni")
    cantidad = float(datos.get("cantidad"))

    sql_saldo = "SELECT monedero FROM Usuarios WHERE udni = %s"
    filas = enviarSelect(sql_saldo, udni)

    if not filas:
        return {"error": "usuario no encontrado."}, 404
    
    saldo_actual = float(filas[0]['monedero'])
    
    if saldo_actual + cantidad < 0:
        return {"error": "saldo insuficiente."}, 400
    
    if saldo_actual + cantidad > 999.99:
        return {"error": "El saldo no puede superar los 999.99€."}, 400

    sql = "UPDATE Usuarios SET monedero = monedero + %s WHERE udni = %s"
    param = (cantidad, udni)
    enviarCommit(sql, param)
    
    sql = "SELECT monedero FROM Usuarios WHERE udni = %s"
    filas = enviarSelect(sql, udni)

    return flask.jsonify(filas)

@app.route('/ajustes', methods=['GET'])
def end_ajustes():
    datos = flask.request.get_json()

    calcularValoracion(datos.get("udni"))

    sql = "SELECT nombre, apellidos, cp, monedero, nivel_de_juego, valoracion FROM Usuarios WHERE udni = %s"
    filas = enviarSelect(sql, datos.get("udni"))

    if not filas:
        return {"error": "Usuario no encontrado"}, 404

    return flask.jsonify(filas)

@app.route('/actualizarusuario', methods=['POST'])
def end_actualizar_usuario():
    datos = flask.request.get_json()

    sql = "UPDATE Usuarios SET nombre = %s, apellidos = %s, cp = %s, nivel_de_juego = %s WHERE udni = %s"
    param = (datos.get("nombre"), datos.get("apellidos"), datos.get("cp"), datos.get("nivel_de_juego"), datos.get("udni"))
    
    resultado = enviarCommit(sql, param)
    return flask.jsonify(resultado)

@app.route('/empresascercanas', methods=['GET'])
def end_empresas_cercanas():
    datos = flask.request.get_json()

    sql = "SELECT cp FROM usuarios WHERE udni = %s;"
    try:
        usercp = int(enviarSelect(sql, datos.get("udni"))[0]['cp']) # obtenemos el cp del usuario
    except Exception:
        return {"error": "Usuario no encontrado."}, 404

    sql = "SELECT nombre, direccion FROM empresas;" # obtenemos las direcciones de las empresas
    filas = enviarSelect(sql)

    for fila in filas:  # por cada fila, buscamos el cp
        direccion = fila['direccion']
        empresa_cp = None
        for parte in direccion.split(): # dividimos la direccion en partes
            if parte[:-1].isdigit() and len(parte[:-1]) == 5: # comprobamos si es cp
                empresa_cp = int(parte[:-1])
                break
        
        if empresa_cp is not None:
            fila['distancia'] = abs(usercp - empresa_cp) # calculamos distancia
    
    filas.sort(key=lambda x: x['distancia']) # ordenamos por distancia

    for fila in filas: # eliminamos distancia para la respuesta
        fila.pop('distancia', None)

    return flask.jsonify(filas)

# Hechas por el equipo de front
@app.route('/empresa/<string:nombre>', methods=['GET'])
def end_obtenerEmpresa(nombre):
    """Obtiene una empresa por nombre con sus pistas y opcionalmente disponibilidad"""
    fecha = flask.request.args.get('fecha')  # formato: YYYY-MM-DD (opcional)
    
    sql = """
        SELECT 
            e.eid,
            e.nombre,
            e.direccion,
            e.hora_apertura,
            e.hora_cierre
        FROM Empresas e
        WHERE e.nombre = %s
    """
    empresas = enviarSelect(sql, nombre)
    
    if isinstance(empresas, tuple):
        return empresas
    
    if not empresas:
        return {"error": "Empresa no encontrada"}, 404
    
    empresa = empresas[0]
    eid = empresa['eid']  # guardamos el eid para consultas
    normalizarHoras([empresa])
    empresa.pop('eid', None)  # eliminamos eid de la respuesta
    
    # obtener pistas de la empresa
    sql_pistas = """
        SELECT 
            pid,
            tipo,
            indoor
        FROM Pistas 
        WHERE empresa = %s
    """
    pistas = enviarSelect(sql_pistas, eid)
    
    if isinstance(pistas, tuple):
        empresa['pistas'] = []
    else:
        # si se proporciona fecha, obtener disponibilidad de cada pista
        if fecha:
            for pista in pistas:
                sql_reservas = """
                    SELECT hora_inicio, duracion, estado
                    FROM Reserva 
                    WHERE pista = %s AND DATE(hora_inicio) = %s AND estado != 'Realizada'
                """
                reservas = enviarSelect(sql_reservas, (pista['pid'], fecha))
                
                reservas_formateadas = []
                if not isinstance(reservas, tuple):
                    for r in reservas:
                        if isinstance(r['hora_inicio'], datetime.datetime):
                            r['hora_inicio'] = r['hora_inicio'].strftime('%H:%M')
                        reservas_formateadas.append(r)
                
                pista['reservas'] = reservas_formateadas
        
        empresa['pistas'] = pistas
    
    return flask.jsonify(empresa)


@app.route('/empresas', methods=['GET'])
def end_obtenerEmpresas():
    """Obtiene todas las empresas con sus pistas"""
    sql = """
        SELECT 
            e.eid,
            e.nombre,
            e.direccion,
            e.hora_apertura,
            e.hora_cierre
        FROM Empresas e
        ORDER BY e.nombre
    """
    empresas = enviarSelect(sql)
    
    if isinstance(empresas, tuple):  # error
        return empresas
    
    normalizarHoras(empresas)
    
    # para cada empresa, obtener sus pistas
    for empresa in empresas:
        sql_pistas = """
            SELECT 
                pid,
                tipo,
                indoor
            FROM Pistas 
            WHERE empresa = %s
        """
        pistas = enviarSelect(sql_pistas, empresa['eid'])
        if not isinstance(pistas, tuple):
            empresa['pistas'] = pistas
        else:
            empresa['pistas'] = []
    
    return flask.jsonify(empresas)

##* Ejecutar la app *###
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)