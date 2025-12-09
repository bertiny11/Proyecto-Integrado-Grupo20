import os
import datetime
from backend.app import enviarConsulta, normalizarHoras
import flask # type: ignore

# Cargar variables de entorno de la BD
DB_NAME = os.getenv("MYSQL_DATABASE")
DB_USER = os.getenv("MYSQL_USER")
DB_PASS = os.getenv("MYSQL_PASSWORD")
DB_HOST = os.getenv("MYSQL_HOST")
DB_PORT = int(os.getenv("MYSQL_PORT"))

# Configurar Flask
app = flask.Flask(__name__)
app.json.ensure_ascii = False

@app.route('/login', methods=['GET']) # FRONT USA /LOGIN
def end_login():
    datos = flask.request.get_json()
    sql = "SELECT contrasena FROM Usuarios WHERE udni = %s"
    filas = enviarConsulta(sql, datos.get("udni"))

    if not filas:
        return {"Error", "Usuario no encontrado"}, 404

    if filas[0]['contrasena'] == datos.get['contrasena']:
        sql = 'SELECT nombre, monedero FROM Usuarios WHERE udni = %s'
        filas = enviarConsulta(sql, datos.get("udni"))
        return flask.jsonify(filas)

    return {"error": "Contraseña incorrecta"}, 404


# VER RESERVAS

@app.route('/usuario/<string:udni>/reservas', methods=['GET'])
def end_ver_reservas(udni):
    
    sql = """SELECT 
            u.udni,
            u.nombre,
            u.apellidos,
            pr.es_creador,
            pr.pagado,
            r.rid,
            r.hora_inicio,
            r.duracion,
            r.nivel_de_juego,
            r.tipo,
            r.huecos_libres,
            r.estado,
            p.pid,
            e.nombre AS empresa
        FROM Usuarios u
        JOIN ParticipantesReserva pr ON u.uid = pr.usuario
        JOIN Reserva r ON pr.reserva = r.rid
        JOIN Pistas p ON r.pista = p.pid
        JOIN Empresas e ON p.empresa = e.eid
        WHERE u.udni = %s
        ORDER BY r.hora_inicio DESC;"""
    
    filas = enviarConsulta(sql, [udni])

    if not filas:
        return {"Error": "No existen reservas para este usuario"}, 404
    
    normalizarHoras(filas)
    return flask.jsonify(filas)

# MODIFICAR RESERVA

@app.route('/usuario/<string:udni>/modificarreserva', methods=['GET'])
def end_modificar_reserva(udni):
    datos = flask.request.get_json()
    sql = """UPDATE Reserva r
            JOIN ParticipantesReserva pr ON r.rid = pr.reserva
            JOIN Usuarios u ON pr.usuario = u.uid
            SET r.hora_inicio = %s,
                r.duracion = %s,
                r.nivel_de_juego = %s,
                r.tipo = %s,
                r.huecos_libres = %s,
                r.estado = %s
            WHERE u.udni = %s AND r.rid = %s"""
    
    param = (datos.get("hora_inicio"), datos.get("duracion"), datos.get("nivel_de_juego"),
             datos.get("tipo"), datos.get("huecos_libres"), datos.get("estado"),
             udni, datos.get("rid"))
    
    resultado = enviarConsulta(sql, param)
    return flask.jsonify(resultado)

# RECARGAR MONEDERO

@app.route('/usuario/recargar', methods=['POST'])
def end_recargar_monedero():
    datos = flask.request.get_json()
    
    sql = "UPDATE Usuarios SET monedero = monedero + %s WHERE udni = %s"
    param = (datos.get("cantidad"), datos.get("udni"))
    enviarConsulta(sql, param)
    
    sql = "SELECT monedero FROM Usuarios WHERE udni = %s"
    filas = enviarConsulta(sql, datos.get("udni"))
    
    if not filas:
        return {"error": "Usuario no encontrado"}, 404

    return flask.jsonify(filas)












if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)