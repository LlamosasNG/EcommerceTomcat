-- Iniciar mysql mediante usuario hugo 
-- mysql -u hugo -p < database.sql

-- Crear base de datos
create database servicio_web;

-- Conectar a la base de datos
use servicio_web;

-- Crear la tabla de usuarios 
create table usuarios (
	id_usuario integer auto_increment primary key,
	email varchar(100) not null,
	nombre varchar(100) not null,
	apellido_paterno varchar(100) not null,
	apellido_materno varchar(100),
	fecha_nacimiento datetime not null,
	telefono bigint,
	genero char(1)
);

-- Crear la tabla de fotos_usuarios
create table fotos_usuarios (
	id_foto integer auto_increment primary key,
	foto longblob,
	id_usuario integer not null
);

-- Crear una regla de integridad referencial
alter table fotos_usuarios add foreign key (id_usuario) references usuarios(id_usuario);

-- Crear un indice único
create unique index usuarios_1 on usuarios(email);

-- Crear la tabla stock 
CREATE TABLE stock (
    id_articulo INTEGER AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    cantidad INTEGER NOT NULL
);

-- Crear la tabla fotos_articulos
CREATE TABLE fotos_articulos (
    id_foto INTEGER AUTO_INCREMENT PRIMARY KEY,
    foto LONGBLOB,
    id_articulo INTEGER NOT NULL
);

-- Agregar la restricción de clave foránea
ALTER TABLE fotos_articulos ADD FOREIGN KEY (id_articulo) REFERENCES stock(id_articulo);

-- Crear la tabla carrito_compra
CREATE TABLE carrito_compra (
    id_usuario INTEGER NOT NULL,
    id_articulo INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    PRIMARY KEY (id_usuario, id_articulo)
);

-- Agregar las restricciones de clave foránea
ALTER TABLE carrito_compra ADD FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario);
ALTER TABLE carrito_compra ADD FOREIGN KEY (id_articulo) REFERENCES stock(id_articulo);

-- Agregar los campos password y token a la tabla usuarios
ALTER TABLE usuarios 
ADD COLUMN password VARCHAR(20),
ADD COLUMN token VARCHAR(20);