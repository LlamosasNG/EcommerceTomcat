/*
  Carlos Pineda Guerrero, septiembre 2024
*/

package servicio_json;

import java.sql.Timestamp;

public class Usuario
{
  String email;
  String nombre;
  String apellido_paterno;
  String apellido_materno;
  Timestamp fecha_nacimiento;
  Long telefono;
  String genero;
  byte[] foto;
}
