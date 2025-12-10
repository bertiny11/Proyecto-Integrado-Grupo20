SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES 'utf8mb4';

-- Tabla Usuarios
CREATE TABLE `Usuarios` (
  `uid` int AUTO_INCREMENT,
  `udni` varchar(9) NOT NULL,
  `contrasena` varchar(100),        -- UCA no necesita contrasenas
  `nombre` varchar(100) NOT NULL,
  `apellidos` varchar(200) NOT NULL,
  `cp` varchar(100) DEFAULT NULL,
  `monedero` decimal(5,2) NOT NULL DEFAULT 0.00, -- max 999.99
  `nivel_de_juego`  enum('A','B','C','D','F') NOT NULL DEFAULT 'F',
  `valoracion` decimal(3,1) NOT NULL DEFAULT 0.0, -- 0.0 a 5.0
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
  PRIMARY KEY (`eid`),
  UNIQUE KEY `ux_empresas_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla Pistas
CREATE TABLE `Pistas` (
  `pid` int AUTO_INCREMENT,
  `empresa` int NOT NULL,             -- referencia a Empresas.eid
  `tipo`  enum('muro','cristal') NOT NULL DEFAULT 'cristal',
  `indoor` boolean NOT NULL DEFAULT 0, -- 0 = outdoor, 1 = indoor
  PRIMARY KEY (`pid`),
  CONSTRAINT `fk_pistas_empresa` FOREIGN KEY (`empresa`) REFERENCES `Empresas`(`eid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla Reserva
CREATE TABLE `Reserva` (
  `rid` int AUTO_INCREMENT,
  `pista` int NOT NULL,               -- referencia a Pistas.pid
  `hora_inicio` datetime NOT NULL,
  `duracion` int NOT NULL,            -- en minutos (60, 90, 120)
  `nivel_de_juego`  enum('A','B','C','D','F') NOT NULL,
  `tipo`  enum('Completa','Libre') NOT NULL,
  `huecos_libres` int NOT NULL DEFAULT 3,   -- max 3 (validar en app)
  `estado`  enum('Pendiente','Completa','Realizada') NOT NULL DEFAULT 'Pendiente',
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

-- Tabla Valoraciones
CREATE TABLE `Valoraciones` (
  `vid` INT AUTO_INCREMENT,
  `reserva` INT NOT NULL,                -- referencia a Reserva.rid
  `evaluador` INT NOT NULL,               -- quien valora referencia a Usuarios.uid
  `evaluado` INT NOT NULL,               -- quien recibe referencia a Usuarios.uid
  `valoracion` decimal(2,1) NOT NULL, -- 1..5 (validar en app)
  `comentario` VARCHAR(250) DEFAULT NULL,
  PRIMARY KEY (`vid`),
  UNIQUE KEY `ux_valoracion_unica` (`reserva`, `evaluador`, `evaluado`), -- una valoración por reserva por pareja
  CONSTRAINT `fk_valoraciones_reserva` FOREIGN KEY (`reserva`) REFERENCES `Reserva`(`rid`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_valoraciones_evaluador` FOREIGN KEY (`evaluador`) REFERENCES `Usuarios`(`uid`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_valoraciones_evaluado` FOREIGN KEY (`evaluado`) REFERENCES `Usuarios`(`uid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ********************************
-- * Ejemplos de datos (opcional) *
-- ********************************

-- Usuarios
INSERT INTO `Usuarios` (`uid`,`udni`,`contrasena`,`nombre`,`apellidos`,`cp`,`monedero`,`nivel_de_juego`,`valoracion`) VALUES
(1, 'u11111111', 'contrasena_hash', 'Altagracia', 'García', '11500', 0.00, 'A', 5.0),
(2, 'u22222222', 'contrasena_hash', 'Apolinario', 'Martín', '11408', 999.99, 'B', 3.8),
(3, 'u33333333', 'contrasena_hash', 'Arnulfo', 'López', '11009', 5.50,  'C', 0.0),
(4, 'u44444444', 'contrasena_hash', 'Arsenio', 'Sánchez', '11411', 100.00,'D', 4.9),
(5, 'u55555555', 'contrasena_hash', 'Bonifacio', 'Ruiz', '11009', 50.00,   'F', 1.5),
(6, 'u66666666', 'contrasena_hash', 'Burgundófora', 'Fernández', '11009', 10.00, 'A', 3.7),
(7, 'u77777777', 'contrasena_hash', 'Cipriniano', 'Torres', '11500', 15.00, 'B', 4.2),
(8, 'u88888888', 'contrasena_hash', 'Expiración', 'Molina', '11009', 7.50,  'C', 2.5);

-- Sanciones
INSERT INTO `Sanciones` (`usuario`,`fecha_fin`) VALUES
(2, '2025-11-15 23:59:59'),
(5, '2025-12-01 00:00:00'),
(5, '2026-01-15 15:28:09');

-- Empresas
INSERT INTO `Empresas` (`eid`,`nombre`,`direccion`,`hora_apertura`,`hora_cierre`) VALUES
(1, 'UCA', 'C. Republica Saharaui, 11519, Puerto Real, Cádiz', '08:00:00', '21:00:00'),
(2, 'No se Padel ', 'C. Invento, 11405, Jerez de la Frontera, Cádiz', '07:00:00', '20:00:00'),
(3, 'Padel No se', 'C. Esta, 11009, Cádiz, Cádiz', '08:00:00', '21:00:00');

-- Pistas
INSERT INTO `Pistas` (`pid`,`empresa`,`tipo`,`indoor`) VALUES
  -- Empresa 1
(1, 1, 'cristal', 0),
(2, 1, 'cristal', 0),
(3, 1, 'cristal', 0),
  -- Empresa 2
(4, 2, 'muro', 0),
(5, 2, 'cristal', 1),
(6, 2, 'muro', 1),
  -- Empresa 3
(7, 3, 'cristal', 0),
(8, 3, 'muro', 0),
(9, 3, 'cristal', 1);

-- Reserva
INSERT INTO `Reserva` (`rid`,`pista`,`hora_inicio`, `duracion`, `nivel_de_juego`,`tipo`,`huecos_libres`,`estado`) VALUES
(1, 1, '2025-11-01 18:00:00', 60, 'B', 'Completa', 0, 'Completa'), 
(2, 2, '2025-11-02 10:00:00', 90, 'C', 'Completa', 3, 'Pendiente'),
(3, 5, '2025-11-03 12:00:00', 120, 'F', 'Libre', 2, 'Pendiente'),
(4, 7, '2025-10-30 18:00:00', 60, 'B', 'Completa', 0, 'Realizada');

-- ParticipantesReserva
INSERT INTO `ParticipantesReserva` (`prid`,`reserva`,`usuario`,`es_creador`,`pagado`) VALUES
  -- Reserva 1
(1, 1, 2, 1, 0),
(2, 1, 1, 0, 1),
(3, 1, 7, 0, 1),
(4, 1, 8, 0, 1),
  -- Reserva 2
(5, 2, 3, 1, 0),
  -- Reserva 3
(6, 3, 5, 1, 1),
(7, 3, 4, 0, 1),
  -- Reserva 4
(8, 4, 2, 1, 1),
(9, 4, 7, 0, 1),
(10,4, 1, 0, 1),
(11,4, 6, 0, 1);

-- InvitacionesReserva
INSERT INTO `InvitacionesReserva` (`irid`,`reserva`,`usuario`) VALUES
(1, 2, 2),
(2, 2, 8);

-- Valoraciones
INSERT INTO `Valoraciones` (`vid`,`reserva`,`evaluador`,`evaluado`,`valoracion`,`comentario`) VALUES
(1, 4, 7, 2, 5, 'Gran compañero y fairplay'),
(2, 4, 1, 2, 2.5, NULL);

COMMIT;