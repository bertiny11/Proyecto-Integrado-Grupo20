SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Tabla Usuarios
CREATE TABLE `Usuarios` (
  `uid` int AUTO_INCREMENT,
  `udni` varchar(10) NOT NULL,
  `contrasena` varchar(100) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellidos` varchar(200) NOT NULL,
  `monedero` decimal(5,2) NOT NULL DEFAULT 0.00,
  `nivel_de_juego`  enum('A','B','C','D','F') NOT NULL,
  PRIMARY KEY (`uid`),
  UNIQUE KEY `udni` (`udni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla Sanciones
CREATE TABLE `Sanciones` (
  `usuario` int NOT NULL,             -- referencia a Usuarios.uid
  `fecha_fin` datetime NOT NULL,
  PRIMARY KEY (`usuario`, `fecha_fin`),
  CONSTRAINT `fk_sanciones_usuario` FOREIGN KEY (`usuario`) REFERENCES `Usuarios`(`uid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla Empresas
CREATE TABLE `Empresas` (
  `eid` int AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `direccion` varchar(300) NOT NULL,
  `hora_apertura` time NOT NULL,
  `hora_cierre` time NOT NULL,
  PRIMARY KEY (`eid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla Pistas
CREATE TABLE `Pistas` (
  `pid` int AUTO_INCREMENT,
  `empresa` int NOT NULL,             -- referencia a Empresas.eid
  `tipo`  enum('muro','cristal') NOT NULL DEFAULT 'cristal',
  `indoor` boolean NOT NULL DEFAULT 0, -- 0 = outdoor, 1 = indoor
  `precio` decimal(5,2) NOT NULL DEFAULT 0.00, -- max 999.99
  PRIMARY KEY (`pid`),
  CONSTRAINT `fk_pistas_empresa` FOREIGN KEY (`empresa`) REFERENCES `Empresas`(`eid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla Reserva
CREATE TABLE `Reserva` (
  `rid` int AUTO_INCREMENT,
  `pista` int NOT NULL,               -- referencia a Pistas.pid
  `hora_inicio` datetime NOT NULL,
  `nivel_de_juego`  enum('A','B','C','D','F') NOT NULL,
  `tipo`  enum('Completa','Libre') NOT NULL,
  `huecos_libres` int NOT NULL DEFAULT 3,   -- max 3 (validar en app)
  `estado`  enum('Pendiente','Completa') NOT NULL DEFAULT 'Pendiente',
  PRIMARY KEY (`rid`),
  CONSTRAINT `fk_reserva_pista` FOREIGN KEY (`pista`) REFERENCES `Pistas`(`pid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla ParticipantesReserva
CREATE TABLE `ParticipantesReserva` (
  `prid` int AUTO_INCREMENT,
  `reserva` int NOT NULL,             -- referencia a Reserva.rid
  `usuario` int NOT NULL,             -- referencia a Usuarios.uid
  `es_creador` boolean NOT NULL DEFAULT 0, -- 0 = no, 1 = sí
  `pagado` boolean NOT NULL DEFAULT 0,     -- 0 = no, 1 = sí
  PRIMARY KEY (`prid`),
  UNIQUE KEY `ux_participantes_reserva` (`reserva`, `usuario`),
  CONSTRAINT `fk_partreserva_reserva` FOREIGN KEY (`reserva`) REFERENCES `Reserva`(`rid`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_partreserva_usuario` FOREIGN KEY (`usuario`) REFERENCES `Usuarios`(`uid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla InvitacionesReserva
CREATE TABLE `InvitacionesReserva` (
  `irid` int AUTO_INCREMENT,
  `reserva` int NOT NULL,             -- referencia a Reserva.rid
  `usuario` int NOT NULL,             -- referencia a Usuarios.uid (invitado)
  PRIMARY KEY (`irid`),
  CONSTRAINT `fk_invitaciones_reserva_reserva` FOREIGN KEY (`reserva`) REFERENCES `Reserva`(`rid`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_invitaciones_reserva_usuario` FOREIGN KEY (`usuario`) REFERENCES `Usuarios`(`uid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

COMMIT;