# Proyecto-Integrado-Grupo20
## Estructura de la base de datos:
**Usuarios**: uid (u+dni), nombre, apellidos, monedero, nivel de juego (A, B, C, D, F)

**Sanciones**: Usuario, fecha fin

**Empresas**: eid, nombre, dirección, hora apertura, hora cierre

**Pistas**: pid, *Empresa* (eid), tipo (muro o cristal), indoor (booleano), precio

**Reserva**: rid, *Pista* (pid), hora inicio, nivel de juego, tipo (Completa/libre), huecos libres (max 3), estado (pendiente/completa)

**ParticipantesReserva**: prid, *Reserva* (rid), *Usuario* (uid), es creador, pagado (booleano)

**InvitacionesReserva**: irid, *Reserva* (rid), *Usuario* (uid)