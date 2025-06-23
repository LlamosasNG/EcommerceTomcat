/*
  Autor: Carlos Pineda Guerrero, septiembre 2024
  Modificado por: Gonzalez Llamosas Noe Ramses, junio 2025
*/

package servicio_json;

import java.sql.Timestamp;

public class Usuario
{
  String email;
  String nombre;
  String password;
  String apellido_paterno;
  String apellido_materno;
  Timestamp fecha_nacimiento;
  Long telefono;
  String genero;
  byte[] foto;
}
