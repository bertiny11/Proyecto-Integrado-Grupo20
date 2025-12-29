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

precios = { # define los precios segun duracion
    60: 5.0,
    90: 7.0,
    120: 9.0
}

mapa = {    # define los niveles de juego permitidos
    'A': ['A', 'B'],
    'B': ['A', 'B', 'C'],
    'C': ['B', 'C', 'D'],
    'D': ['C', 'D', 'F'],
    'F': ['D', 'F']
    }

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

    filas = enviarSelect("SELECT udni, nombre, apellidos, contrasena, monedero, nivel_de_juego, valoracion, cp FROM Usuarios WHERE udni = %s", udni)

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
            "apellidos": usuario.get("apellidos"), # deberia funcionar solo con udni
            "monedero": usuario.get("monedero"),
            "nivel_de_juego": usuario.get("nivel_de_juego"),
            "valoracion": usuario.get("valoracion"),
            "cp": usuario.get("cp")
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
        usercp = 0 # si no tiene cp, ponemos 0 para default

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

@app.route('/reservar', methods=['POST'])
def end_reservar():
    datos = flask.request.get_json()
    try:
        with conectarBD() as conexion:
            with conexion.cursor() as cursor:
                # Comprobamos que el usuario pueda crear reservas en el nivel solicitado
                cursor.execute("""
                    SELECT nivel_de_juego FROM Usuarios WHERE udni = %s;""", (
                    
                    datos["udni"],))
                fila = cursor.fetchone() # guardamos la fila
                
                if not fila:
                    conexion.rollback()
                    return {"error": "Usuario no encontrado"}, 404
                
                niveles_permitidos = mapa.get(fila["nivel_de_juego"])
                if datos["nivel_de_juego"] not in niveles_permitidos:
                    conexion.rollback()
                    return {"error": "Nivel de juego no permitido para este usuario"}, 400

                # Comprobamos que la pista este libre en el horario solicitado
                cursor.execute("""
                    SELECT 1 FROM Reserva
                    WHERE pista = %s
                    AND hora_inicio < DATE_ADD(%s, INTERVAL %s MINUTE)
                    AND DATE_ADD(hora_inicio, INTERVAL duracion MINUTE) > %s;""", (
                    
                    int(datos["pista"]),
                    datos["hora_inicio"],
                    int(datos["duracion"]),
                    datos["hora_inicio"]))

                if cursor.fetchone(): # si hay alguna fila, la pista está ocupada
                    conexion.rollback() # deshacemos cambios
                    return {"error": "La pista ya está reservada"}, 409

                # Comprobamos que el usuario tenga dinero suficiente
                cursor.execute(
                    "SELECT monedero FROM Usuarios WHERE udni = %s",
                    (datos["udni"]))
                fila = cursor.fetchone() # guardamos la fila

                if not fila:
                    conexion.rollback()
                    return {"error": "Usuario no encontrado"}, 404

                # Calcular el coste según el tipo
                precio_base = precios.get(int(datos["duracion"]))
                if datos["tipo"] == "Libre": # si es libre, pagas tu parte (1/4)
                    coste = precio_base / 4
                else:  # Completa: pagas el precio completo
                    coste = precio_base

                if fila["monedero"] < coste:
                    conexion.rollback()
                    return {"error": "Saldo insuficiente"}, 400

                # Determinamos los huecos libres según el tipo
                if datos["tipo"] == "Libre":
                    huecos_libres = 3  # Quedan 3 huecos después del creador
                else:  # Completa
                    huecos_libres = 0  # No hay huecos libres

                # Creamos la reserva
                cursor.execute("""
                    INSERT INTO Reserva (pista, hora_inicio, duracion, nivel_de_juego, tipo, huecos_libres)
                    VALUES (%s, %s, %s, %s, %s, %s);""", (
                    
                    int(datos["pista"]),
                    datos["hora_inicio"],
                    int(datos["duracion"]),
                    datos["nivel_de_juego"],
                    datos["tipo"],
                    huecos_libres))
                
                rid = cursor.lastrowid  # obtenemos el id de la reserva creada

                # Restamos monedero
                cursor.execute("""UPDATE Usuarios SET monedero = monedero - %s 
                                WHERE udni = %s;""", (
                                coste, datos["udni"]))

                # Creamos el participante creador
                cursor.execute("""
                    INSERT INTO ParticipantesReserva (reserva, usuario, es_creador, pagado)
                    VALUES (%s, (SELECT uid FROM Usuarios WHERE udni = %s), 1, 1);""", (
                    
                    rid,
                    datos["udni"]))

                conexion.commit() # confirmamos los cambios
                return {"message": "Reserva creada"}, 201
    except Exception:
        return {"error": "Error interno del servidor"}, 500

@app.route('/reservasnivel', methods=['GET'])
def end_reservas_nivel():
    datos = flask.request.get_json()

    niveles = mapa.get(datos.get("nivel_de_juego"))
    
    if not niveles:
        return {"Error": "Nivel de juego no válido"}, 400
    
    nivelesSQL = ', '.join(['%s'] * len(niveles)) # pinta %s segun el nº de niveles
    
    sql = f"""SELECT 
                r.rid,
                p.tipo,
                r.hora_inicio,
                r.duracion,
                r.nivel_de_juego,
                r.huecos_libres,
                e.nombre AS empresa
            FROM Reserva r
            JOIN Pistas p ON r.pista = p.pid
            JOIN Empresas e ON p.empresa = e.eid
            WHERE r.hora_inicio > DATE_ADD(NOW(), INTERVAL 10 MINUTE)
            AND r.tipo = 'Libre'
            AND r.estado = 'Pendiente'
            AND r.huecos_libres > 0
            AND r.nivel_de_juego IN ({nivelesSQL})
            ORDER BY r.hora_inicio ASC;
            """

    filas = enviarSelect(sql, niveles)

    if not filas:
        return {"Error": "No existen reservas para este nivel de juego"}, 404
    
    normalizarHoras(filas)
    return flask.jsonify(filas)

@app.route('/enviarpeticion', methods=['POST'])
def end_enviar_peticion():
    datos = flask.request.get_json()

    # comprobamos que el usuario tenga dinero suficiente
    sql = """SELECT monedero, nivel_de_juego FROM Usuarios WHERE udni = %s;"""
    filas = enviarSelect(sql, datos.get("udni"))
    
    if not filas:
        return {"error": "usuario no encontrado."}, 404
    
    sql = """SELECT duracion FROM Reserva WHERE rid = %s;""" # obtenemos la duracion para saber el precio
    filas_duracion = enviarSelect(sql, datos.get("rid"))[0]['duracion']
    
    if float(filas[0]['monedero']) < precios.get(filas_duracion):
        return {"error": "saldo insuficiente. Se requieren al menos " + str(precios.get(filas_duracion)) + "€ para enviar una petición."}, 400

    # Comprobamos que el usuario tenga nivel de juego valido
    niveles = mapa.get(filas[0]['nivel_de_juego'])
    if not niveles:
        return {"Error": "Nivel de juego no válido"}, 400
    
    nivelesSQL = ', '.join(['%s'] * len(niveles)) # pinta %s segun el nº de niveles
    sql = f"""SELECT r.rid
            FROM Reserva r
            JOIN Pistas p ON r.pista = p.pid
            WHERE r.rid = %s
            AND r.nivel_de_juego IN ({nivelesSQL});"""
    filas = enviarSelect(sql, [datos.get("rid")] + niveles)
    if not filas:
        return {"Error": "El usuario no tiene el nivel de juego requerido para esta reserva."}, 400

    # Comprobamos que no exista ya una invitacion para esa reserva y usuario
    sql = """SELECT 1 FROM InvitacionesReserva
            WHERE reserva = %s AND usuario = (SELECT uid FROM Usuarios WHERE udni = %s);"""
    filas = enviarSelect(sql, (datos.get("rid"), datos.get("udni")))
    if filas:
        return {"error": "Ya existe una invitación para este usuario y reserva."}, 409

    # Comprobamos que el usuario no sea ya participante de la reserva
    sql = """SELECT 1 FROM ParticipantesReserva
            WHERE reserva = %s AND usuario = (SELECT uid FROM Usuarios WHERE udni = %s);"""
    filas = enviarSelect(sql, (datos.get("rid"), datos.get("udni")))
    if filas:
        return {"error": "El usuario ya es participante de esta reserva."}, 409

    # Creamos la invitacion
    sql = """INSERT INTO InvitacionesReserva (reserva, usuario)
            VALUES (%s, (SELECT uid FROM Usuarios WHERE udni = %s));"""
    param = (datos.get("rid"), datos.get("udni"))

    resultado = enviarCommit(sql, param)
    return flask.jsonify(resultado)

@app.route('/aceptarpeticion', methods=['POST'])
def end_aceptar_peticion():
    datos = flask.request.get_json()

    try:
        with conectarBD() as conexion:
            with conexion.cursor() as cursor:
                # Comprobamos que haya huecos libres en la reserva
                cursor.execute("""SELECT huecos_libres FROM Reserva WHERE rid = (SELECT reserva FROM InvitacionesReserva WHERE irid = %s);""", 
                                (datos.get("irid")))
                huecos_libres = cursor.fetchall()
                if not huecos_libres:   # reserva no encontrada
                    return {"error": "reserva no encontrada."}, 404
                
                if huecos_libres[0]['huecos_libres'] <= 0: # si no hay huecos libres, eliminamos la invitacion
                    cursor.execute("""DELETE FROM InvitacionesReserva WHERE irid = %s;""",
                                    (datos.get("irid"),))
                    return {"error": "No hay huecos libres en la reserva."}, 400

                # comprobaremos que el usuario tenga dinero suficiente
                cursor.execute("""SELECT monedero FROM Usuarios WHERE uid = (SELECT usuario FROM InvitacionesReserva WHERE irid = %s);""", 
                                (datos.get("irid")))
                monedero = cursor.fetchall()
                if not monedero:   # usuario no encontrado
                    return {"error": "usuario no encontrado."}, 404
                
                cursor.execute("""SELECT duracion FROM Reserva WHERE rid = (SELECT reserva FROM InvitacionesReserva WHERE irid = %s);""", # obtenemos duracion para saber precio
                                (datos.get("irid")))
                #filas_duracion = enviarSelect(sql, datos.get("rid"))[0]['duracion']
                coste = precios.get(cursor.fetchall()[0]['duracion'])
                if float(monedero[0]['monedero']) < coste:
                    return {"error": "saldo insuficiente. Se requieren al menos " + str(coste) + "€ para aceptar la petición."}, 400

                # restamos al monedero
                cursor.execute("""UPDATE Usuarios SET monedero = monedero - %s WHERE uid = (SELECT usuario FROM InvitacionesReserva WHERE irid = %s);""", 
                                (coste, datos.get("irid")))

                # Actualizamos la invitacion como aceptada
                # primero creamos un participante en la reserva
                cursor.execute("""INSERT INTO ParticipantesReserva (reserva, usuario, es_creador, pagado)
                                VALUES ((SELECT reserva FROM InvitacionesReserva WHERE irid = %s), (SELECT uid FROM Usuarios WHERE uid = (SELECT usuario FROM InvitacionesReserva WHERE irid = %s)), 0, 1);""",
                                (datos.get("irid"), datos.get("irid")))
                # luego actualizamos los huecos libres
                cursor.execute("""UPDATE Reserva SET huecos_libres = huecos_libres - 1  WHERE rid = (SELECT reserva FROM InvitacionesReserva WHERE irid = %s);""",
                                (datos.get("irid"),))
                # eliminamos la invitacion
                cursor.execute("""DELETE FROM InvitacionesReserva WHERE irid = %s;""",
                                (datos.get("irid"),))

                conexion.commit() # confirmamos los cambios
                return {"message": "Petición aceptada"}, 200
    except Exception:
        return {"error": "Error interno del servidor"}, 500

@app.route('/rechazarpeticion', methods=['POST'])
def end_rechazar_peticion():
    datos = flask.request.get_json()

    sql = """DELETE FROM InvitacionesReserva WHERE irid = %s"""
    param = (datos.get("irid"))
    enviarCommit(sql, param)

    return {"message": "Petición rechazada"}, 200

@app.route('/verpeticiones', methods=['POST'])
def end_ver_peticiones():
    datos = flask.request.get_json()

    sql = """SELECT 
                ir.irid,
                u.nombre,
                u.apellidos,
                p.tipo,
                r.hora_inicio AS "hora inicio",
                r.duracion,
                r.nivel_de_juego AS "nivel de juego",
                r.huecos_libres AS "huecos libres",
                e.nombre AS empresa,
                e.direccion AS direccion
            FROM InvitacionesReserva ir
            JOIN Reserva r ON ir.reserva = r.rid
            JOIN Pistas p ON r.pista = p.pid
            JOIN Empresas e ON p.empresa = e.eid
            JOIN Usuarios u ON ir.usuario = u.uid
            WHERE EXISTS (
                SELECT 1 
                FROM ParticipantesReserva pr
                JOIN Usuarios uc ON pr.usuario = uc.uid
                WHERE pr.reserva = r.rid
                AND uc.udni = %s
                AND pr.es_creador = 1
            )
            ORDER BY r.hora_inicio DESC;
            """

    filas = enviarSelect(sql, [datos.get("udni")])

    if not filas:
        return flask.jsonify([])
    
    #normalizarHoras(filas)
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
                    SELECT rid, hora_inicio, duracion, estado, tipo, huecos_libres, nivel_de_juego
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

@app.route('/eliminar_reserva', methods=['DELETE'])
def end_eliminar_reserva():
    """Elimina una reserva y devuelve el dinero al monedero del usuario"""
    datos = flask.request.get_json()
    rid = datos.get("rid")
    udni = datos.get("udni")
    
    if not rid or not udni:
        return {"error": "Faltan datos requeridos (rid, udni)"}, 400
    
    try:
        with conectarBD() as conexion:
            with conexion.cursor() as cursor:
                # Verificar que la reserva existe y obtener información
                cursor.execute("""
                    SELECT r.rid, r.duracion, r.tipo
                    FROM Reserva r
                    JOIN ParticipantesReserva p ON r.rid = p.reserva
                    JOIN Usuarios u ON p.usuario = u.uid
                    WHERE r.rid = %s AND u.udni = %s
                """, (rid, udni))
                
                reserva = cursor.fetchone()
                if not reserva:
                    return {"error": "Reserva no encontrada o no pertenece al usuario"}, 404
                
                duracion = reserva['duracion']
                tipo = reserva['tipo']
                precio = precios.get(duracion)
                
                # Calcular el reembolso según el tipo
                if tipo == 'Libre':
                    reembolso = precio / 4  # El usuario pagó su parte
                else:  # Completa
                    reembolso = precio  # El usuario pagó todo
                
                # Devolver el dinero al monedero
                cursor.execute("""
                    UPDATE Usuarios 
                    SET monedero = monedero + %s 
                    WHERE udni = %s
                """, (reembolso, udni))
                
                # Eliminar el participante
                cursor.execute("""
                    DELETE FROM ParticipantesReserva 
                    WHERE reserva = %s AND usuario = (SELECT uid FROM Usuarios WHERE udni = %s)
                """, (rid, udni))
                
                # Verificar si quedan más participantes
                cursor.execute("SELECT COUNT(*) as count FROM ParticipantesReserva WHERE reserva = %s", (rid,))
                count = cursor.fetchone()['count']
                
                # Si no quedan participantes, eliminar la reserva
                if count == 0:
                    cursor.execute("DELETE FROM Reserva WHERE rid = %s", (rid,))
                else:
                    # Si quedan participantes y es tipo Libre, incrementar huecos libres
                    if tipo == 'Libre':
                        cursor.execute("""
                            UPDATE Reserva 
                            SET huecos_libres = huecos_libres + 1 
                            WHERE rid = %s
                        """, (rid,))
                
                conexion.commit()
                return {"success": True, "message": "Reserva eliminada correctamente", "reembolso": reembolso}, 200
                
    except Exception as e:
        print(f"Error al eliminar reserva: {str(e)}")
        return {"error": f"Error al eliminar reserva: {str(e)}"}, 500

##* Ejecutar la app *###
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)