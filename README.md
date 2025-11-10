# Proyecto-Integrado-Grupo20
## Base de datos
Para la base de datos hemos utilizado:

 -  MySQL 9.5.0 (Sistema de gestión de BD)
 -  PhpMyAdmin 5.2.3 (Visualizar y modificar datos)

### Estructura

 - **Usuarios**: *uid*, udni, contraseña, nombre, apellidos, monedero, nivel de juego (A, B, C, D, F), valoracion
 - **Sanciones**: *Usuario, fecha fin*
 - **Empresas**: *eid*, nombre, dirección, hora apertura, hora cierre
 - **Pistas**: *pid*, empresa (F eid), tipo (muro o cristal), indoor, precio
 - **Reserva**: *rid*, pista (F pid), hora inicio, nivel de juego, tipo (Completa/Libre), huecos libres, estado (Pendiente/Completa/Realizada)
 - **ParticipantesReserva**: *prid*, reserva (F rid), usuario (F uid), es creador, pagado
 - **InvitacionesReserva**: *irid*, reserva (F rid), usuario (F uid)
 - **Valoraciones**: *vid*, reserva (F rid), evaluador (F uid), evaluado (F uid), valoracion, comentario

## Backend
Para el backend hemos utilizado:
 - Python 3.11
 - PyMySQL (Para la comunicación con la BD)

Los endpoints actuales son:
 - health (Para comprobar que el backend está activo)
 - consulta (Para enviar consultas SQL arbitrarias, solo para debug)
 - usuario/\<uid> (Para obtener los datos de un usuario)
 - empresa/\<nombre> (Para obtener los datos de una empresa)

El backend recibe peticiones del frontend en formato JSON, las interpreta, ejecuta las consultas necesarias en MySQL y devuelve la respuesta también en formato JSON.

## Desarrollador
Para modificar la base de datos, si ya ha sido creada, utilizaremos PhpMyAdmin, si no lo fue, podemos modificar el fichero `padelup.sql`

Para modificar las funcionalidades del backend hay que modificar el fichero `backend/app.py`.


## Usuario
El usuario de nuestra aplicación en ningún momento interactuará ni con la base de datos ni con el backend.