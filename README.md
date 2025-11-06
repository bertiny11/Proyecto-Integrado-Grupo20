# Proyecto-Integrado-Grupo20
## Estructura de la base de datos
**Usuarios**: *uid*, udni, contraseña, nombre, apellidos, monedero, nivel de juego (A, B, C, D, F)

**Sanciones**: *Usuario, fecha fin*

**Empresas**: *eid*, nombre, dirección, hora apertura, hora cierre

**Pistas**: *pid*, empresa (F eid), tipo (muro o cristal), indoor, precio

**Reserva**: *rid*, pista (F pid), hora inicio, nivel de juego, tipo (Completa/Libre), huecos libres, estado (Pendiente/Completa)

**ParticipantesReserva**: *prid*, reserva (F rid), usuario (F uid), es creador, pagado

**InvitacionesReserva**: *irid*, reserva (F rid), usuario (F uid)