/*
  Servicio.java
  Servicio web tipo REST
  Recibe parámetros utilizando JSON
  Carlos Pineda Guerrero, septiembre 2024
*/

package servicio_json;

import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Consumes;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.QueryParam;
import javax.ws.rs.FormParam;
import javax.ws.rs.core.Response;

import java.sql.*;
import javax.sql.DataSource;
import javax.naming.Context;
import javax.naming.InitialContext;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;

import com.google.gson.*;

// la URL del servicio web es http://localhost:8080/Servicio/rest/ws
// donde:
//	"Servicio" es el dominio del servicio web (es decir, el nombre de archivo Servicio.war)
//	"rest" se define en la etiqueta <url-pattern> de <servlet-mapping> en el archivo WEB-INF\web.xml
//	"ws" se define en la siguiente anotación @Path de la clase Servicio

@Path("ws")
public class Servicio
{
  static DataSource pool = null;
  static
  {		
    try
    {
      Context ctx = new InitialContext();
      pool = (DataSource)ctx.lookup("java:comp/env/jdbc/datasource_Servicio");
    }
    catch(Exception e)
    {
      e.printStackTrace();
    }
  }

  static Gson j = new GsonBuilder().registerTypeAdapter(byte[].class,new AdaptadorGsonBase64()).setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS").create();

  @POST
  @Path("alta_usuario")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public Response alta(String json) throws Exception
  {
    ParamAltaUsuario p = (ParamAltaUsuario) j.fromJson(json,ParamAltaUsuario.class);
    Usuario usuario = p.usuario;

    Connection conexion = pool.getConnection();

    if (usuario.email == null || usuario.email.equals(""))
      return Response.status(400).entity(j.toJson(new Error("Se debe ingresar el email"))).build();

    if (usuario.nombre == null || usuario.nombre.equals(""))
      return Response.status(400).entity(j.toJson(new Error("Se debe ingresar el nombre"))).build();

    if (usuario.apellido_paterno == null || usuario.apellido_paterno.equals(""))
      return Response.status(400).entity(j.toJson(new Error("Se debe ingresar el apellido paterno"))).build();

    if (usuario.fecha_nacimiento == null)
      return Response.status(400).entity(j.toJson(new Error("Se debe ingresar la fecha de nacimiento"))).build();

    try
    {
      conexion.setAutoCommit(false);

      PreparedStatement stmt_1 = conexion.prepareStatement("INSERT INTO usuarios(id_usuario,email,nombre,apellido_paterno,apellido_materno,fecha_nacimiento,telefono,genero) VALUES (0,?,?,?,?,?,?,?)");
 
      try
      {
        stmt_1.setString(1,usuario.email);
        stmt_1.setString(2,usuario.nombre);
        stmt_1.setString(3,usuario.apellido_paterno);

        if (usuario.apellido_materno != null)
          stmt_1.setString(4,usuario.apellido_materno);
        else
          stmt_1.setNull(4,Types.VARCHAR);

        stmt_1.setTimestamp(5,usuario.fecha_nacimiento);

        if (usuario.telefono != null)
          stmt_1.setLong(6,usuario.telefono);
        else
          stmt_1.setNull(6,Types.BIGINT);

        if (usuario.genero != null)
          stmt_1.setString(7,usuario.genero);
        else
          stmt_1.setNull(7,Types.CHAR);

        stmt_1.executeUpdate();
      }
      finally
      {
        stmt_1.close();
      }

      if (usuario.foto != null)
      {
        PreparedStatement stmt_2 = conexion.prepareStatement("INSERT INTO fotos_usuarios(id_foto,foto,id_usuario) VALUES (0,?,LAST_INSERT_ID())");
        try
        {
          stmt_2.setBytes(1,usuario.foto);
          stmt_2.executeUpdate();
        }
        finally
        {
          stmt_2.close();
        }
      }
      conexion.commit();
    }
    catch (Exception e)
    {
      conexion.rollback();
      return Response.status(400).entity(j.toJson(new Error(e.getMessage()))).build();
    }
    finally
    {
      conexion.setAutoCommit(true);
      conexion.close();
    }
    return Response.ok().build();
  }

  @POST
  @Path("consulta_usuario")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public Response consulta(String json) throws Exception
  {
    ParamConsultaUsuario p = (ParamConsultaUsuario) j.fromJson(json,ParamConsultaUsuario.class);
    String email = p.email;

    Connection conexion= pool.getConnection();

    try
    {
      PreparedStatement stmt_1 = conexion.prepareStatement("SELECT a.email,a.nombre,a.apellido_paterno,a.apellido_materno,a.fecha_nacimiento,a.telefono,a.genero,b.foto FROM usuarios a LEFT OUTER JOIN fotos_usuarios b ON a.id_usuario=b.id_usuario WHERE email=?");
      try
      {
        stmt_1.setString(1,email);

        ResultSet rs = stmt_1.executeQuery();
        try
        {
          if (rs.next())
          {
            Usuario r = new Usuario();
            r.email = rs.getString(1);
            r.nombre = rs.getString(2);
            r.apellido_paterno = rs.getString(3);
            r.apellido_materno = rs.getString(4);
            r.fecha_nacimiento = rs.getTimestamp(5);
            r.telefono = rs.getObject(6) != null ? rs.getLong(6) : null;
            r.genero = rs.getString(7);
	    r.foto = rs.getBytes(8);
            return Response.ok().entity(j.toJson(r)).build();
          }
          return Response.status(400).entity(j.toJson(new Error("El email no existe"))).build();
        }
        finally
        {
          rs.close();
        }
      }
      finally
      {
        stmt_1.close();
      }
    }
    catch (Exception e)
    {
      return Response.status(400).entity(j.toJson(new Error(e.getMessage()))).build();
    }
    finally
    {
      conexion.close();
    }
  }

  @POST
  @Path("modifica_usuario")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public Response modifica(String json) throws Exception
  {
    ParamModificaUsuario p = (ParamModificaUsuario) j.fromJson(json,ParamModificaUsuario.class);
    Usuario usuario = p.usuario;

    Connection conexion= pool.getConnection();

    if (usuario.email == null || usuario.email.equals(""))
      return Response.status(400).entity(j.toJson(new Error("Se debe ingresar el email"))).build();

    if (usuario.nombre == null || usuario.nombre.equals(""))
      return Response.status(400).entity(j.toJson(new Error("Se debe ingresar el nombre"))).build();

    if (usuario.apellido_paterno == null || usuario.apellido_paterno.equals(""))
      return Response.status(400).entity(j.toJson(new Error("Se debe ingresar el apellido paterno"))).build();

    if (usuario.fecha_nacimiento == null)
      return Response.status(400).entity(j.toJson(new Error("Se debe ingresar la fecha de nacimiento"))).build();

    conexion.setAutoCommit(false);
    try
    {
      PreparedStatement stmt_1 = conexion.prepareStatement("UPDATE usuarios SET nombre=?,apellido_paterno=?,apellido_materno=?,fecha_nacimiento=?,telefono=?,genero=? WHERE email=?");
      try
      {
        stmt_1.setString(1,usuario.nombre);
        stmt_1.setString(2,usuario.apellido_paterno);

        if (usuario.apellido_materno != null)
          stmt_1.setString(3,usuario.apellido_materno);
        else
          stmt_1.setNull(3,Types.VARCHAR);

        stmt_1.setTimestamp(4,usuario.fecha_nacimiento);

        if (usuario.telefono != null)
          stmt_1.setLong(5,usuario.telefono);
        else
          stmt_1.setNull(5,Types.BIGINT);

        if (usuario.genero != null)
          stmt_1.setString(6,usuario.genero);
        else
          stmt_1.setNull(6,Types.CHAR);

        stmt_1.setString(7,usuario.email);

        stmt_1.executeUpdate();
      }
      finally
      {
        stmt_1.close();
      }

      PreparedStatement stmt_2 = conexion.prepareStatement("DELETE FROM fotos_usuarios WHERE id_usuario=(SELECT id_usuario FROM usuarios WHERE email=?)");
      try
      {
        stmt_2.setString(1,usuario.email);
        stmt_2.executeUpdate();
      }
      finally
      {
        stmt_2.close();
      }

      if (usuario.foto != null)
      {
        PreparedStatement stmt_3 = conexion.prepareStatement("INSERT INTO fotos_usuarios(id_foto,foto,id_usuario) VALUES (0,?,(SELECT id_usuario FROM usuarios WHERE email=?))");
        try
        {
          stmt_3.setBytes(1,usuario.foto);
          stmt_3.setString(2,usuario.email);
          stmt_3.executeUpdate();
        }
        finally
        {
          stmt_3.close();
        }
      }
      conexion.commit();
    }
    catch (Exception e)
    {
      conexion.rollback();
      return Response.status(400).entity(j.toJson(new Error(e.getMessage()))).build();
    }
    finally
    {
      conexion.setAutoCommit(true);
      conexion.close();
    }
    return Response.ok().build();
  }

  @POST
  @Path("borra_usuario")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public Response borra(String json) throws Exception
  {
    ParamBorraUsuario p = (ParamBorraUsuario) j.fromJson(json,ParamBorraUsuario.class);
    String email = p.email;

    Connection conexion= pool.getConnection();

    try
    {
      PreparedStatement stmt_1 = conexion.prepareStatement("SELECT 1 FROM usuarios WHERE email=?");
      try
      {
        stmt_1.setString(1,email);

        ResultSet rs = stmt_1.executeQuery();
        try
        {
          if (!rs.next())
		return Response.status(400).entity(j.toJson(new Error("El email no existe"))).build();
        }
        finally
        {
          rs.close();
        }
      }
      finally
      {
        stmt_1.close();
      }
      conexion.setAutoCommit(false);
      PreparedStatement stmt_2 = conexion.prepareStatement("DELETE FROM fotos_usuarios WHERE id_usuario=(SELECT id_usuario FROM usuarios WHERE email=?)");
      try
      {
        stmt_2.setString(1,email);
	stmt_2.executeUpdate();
      }
      finally
      {
        stmt_2.close();
      }

      PreparedStatement stmt_3 = conexion.prepareStatement("DELETE FROM usuarios WHERE email=?");
      try
      {
        stmt_3.setString(1,email);
	stmt_3.executeUpdate();
      }
      finally
      {
        stmt_3.close();
      }
      conexion.commit();
    }
    catch (Exception e)
    {
      conexion.rollback();
      return Response.status(400).entity(j.toJson(new Error(e.getMessage()))).build();
    }
    finally
    {
      conexion.setAutoCommit(true);
      conexion.close();
    }
    return Response.ok().build();
  }

  @POST
  @Path("alta_articulo")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public Response altaArticulo(String json) throws Exception
  {
    ParamAltaArticulo p = (ParamAltaArticulo) j.fromJson(json, ParamAltaArticulo.class);
    Articulo articulo = p.articulo;

    Connection conexion = pool.getConnection();

    // Validación de campos obligatorios
    if (articulo.nombre == null || articulo.nombre.equals(""))
      return Response.status(400).entity(j.toJson(new Error("Se debe ingresar el nombre del artículo"))).build();

    if (articulo.precio == null || articulo.precio <= 0)
      return Response.status(400).entity(j.toJson(new Error("El precio debe ser mayor a cero"))).build();

    if (articulo.cantidad == null || articulo.cantidad < 0)
      return Response.status(400).entity(j.toJson(new Error("La cantidad no puede ser negativa"))).build();
      
    if (articulo.id_usuario == null)
      return Response.status(400).entity(j.toJson(new Error("Se debe proporcionar el ID de usuario"))).build();
      
    if (articulo.token == null || articulo.token.equals(""))
      return Response.status(400).entity(j.toJson(new Error("Se debe proporcionar el token de autenticación"))).build();

    try
    {
      // Verificar que el token corresponda al id_usuario
      PreparedStatement stmt_token = conexion.prepareStatement("SELECT token FROM usuarios WHERE id_usuario=?");
      try
      {
        stmt_token.setInt(1, articulo.id_usuario);
        ResultSet rs = stmt_token.executeQuery();
        
        if (!rs.next())
          return Response.status(401).entity(j.toJson(new Error("El usuario no existe"))).build();
          
        String token_guardado = rs.getString("token");
        rs.close();
        
        if (token_guardado == null || !token_guardado.equals(articulo.token))
          return Response.status(401).entity(j.toJson(new Error("Token inválido"))).build();
      }
      finally
      {
        stmt_token.close();
      }

      // Iniciar transacción
      conexion.setAutoCommit(false);

      // Insertar el artículo en la tabla stock
      PreparedStatement stmt_1 = conexion.prepareStatement("INSERT INTO stock(id_articulo,nombre,descripcion,precio,cantidad) VALUES (0,?,?,?,?)");
      try
      {
        stmt_1.setString(1, articulo.nombre);
        
        if (articulo.descripcion != null)
          stmt_1.setString(2, articulo.descripcion);
        else
          stmt_1.setNull(2, Types.VARCHAR);
          
        stmt_1.setDouble(3, articulo.precio);
        stmt_1.setInt(4, articulo.cantidad);
        
        stmt_1.executeUpdate();
      }
      finally
      {
        stmt_1.close();
      }

      // Si hay foto, insertarla en la tabla fotos_articulos
      if (articulo.foto != null)
      {
        PreparedStatement stmt_2 = conexion.prepareStatement("INSERT INTO fotos_articulos(id_foto,foto,id_articulo) VALUES (0,?,LAST_INSERT_ID())");
        try
        {
          stmt_2.setBytes(1, articulo.foto);
          stmt_2.executeUpdate();
        }
        finally
        {
          stmt_2.close();
        }
      }
      
      conexion.commit();
    }
    catch (Exception e)
    {
      conexion.rollback();
      return Response.status(400).entity(j.toJson(new Error(e.getMessage()))).build();
    }
    finally
    {
      conexion.setAutoCommit(true);
      conexion.close();
    }
    
    return Response.ok().build();
  }

  @POST
  @Path("consulta_articulos")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public Response consultaArticulos(String json) throws Exception
  {
    ParamConsultaArticulos p = (ParamConsultaArticulos) j.fromJson(json, ParamConsultaArticulos.class);
    
    Connection conexion = pool.getConnection();

    // Validación de parámetros
    if (p.id_usuario == null)
      return Response.status(400).entity(j.toJson(new Error("Se debe proporcionar el ID de usuario"))).build();
      
    if (p.token == null || p.token.equals(""))
      return Response.status(400).entity(j.toJson(new Error("Se debe proporcionar el token de autenticación"))).build();

    try
    {
      // Verificar que el token corresponda al id_usuario
      PreparedStatement stmt_token = conexion.prepareStatement("SELECT token FROM usuarios WHERE id_usuario=?");
      try
      {
        stmt_token.setInt(1, p.id_usuario);
        ResultSet rs = stmt_token.executeQuery();
        
        if (!rs.next())
          return Response.status(401).entity(j.toJson(new Error("El usuario no existe"))).build();
          
        String token_guardado = rs.getString("token");
        rs.close();
        
        if (token_guardado == null || !token_guardado.equals(p.token))
          return Response.status(401).entity(j.toJson(new Error("Token inválido"))).build();
      }
      finally
      {
        stmt_token.close();
      }

      List<Articulo> lista = new ArrayList<Articulo>();
      
      // Consulta para obtener artículos que coincidan con la palabra clave
      String sql = "SELECT s.id_articulo, s.nombre, s.descripcion, s.precio, s.cantidad, f.foto " +
                  "FROM stock s " +
                  "LEFT JOIN fotos_articulos f ON s.id_articulo = f.id_articulo ";
      
      // Si se proporcionó una palabra clave, agregar la condición LIKE
      if (p.palabra_clave != null && !p.palabra_clave.equals("")) {
        sql += "WHERE s.nombre LIKE ? OR s.descripcion LIKE ? ";
      }
      
      // Ordenar por id_articulo
      sql += "ORDER BY s.id_articulo";
      
      PreparedStatement stmt = conexion.prepareStatement(sql);
      
      // Si hay palabra clave, establecer los parámetros
      if (p.palabra_clave != null && !p.palabra_clave.equals("")) {
        String patron = "%" + p.palabra_clave + "%";
        stmt.setString(1, patron);
        stmt.setString(2, patron);
      }
      
      try
      {
        ResultSet rs = stmt.executeQuery();
        
        while (rs.next())
        {
          Articulo a = new Articulo();
          a.id_articulo = rs.getInt("id_articulo");
          a.nombre = rs.getString("nombre");
          a.descripcion = rs.getString("descripcion");
          a.precio = rs.getDouble("precio");
          a.cantidad = rs.getInt("cantidad");
          
          // La foto puede ser null
          byte[] foto = rs.getBytes("foto");
          a.foto = (foto != null) ? foto : null;
          
          // No establecemos id_usuario ni token ya que son campos para la autenticación
          // y no forman parte de los datos del artículo que queremos devolver
          
          lista.add(a);
        }
        rs.close();
      }
      finally
      {
        stmt.close();
      }
      
      return Response.ok(j.toJson(lista)).build();
    }
    catch (Exception e)
    {
      return Response.status(400).entity(j.toJson(new Error(e.getMessage()))).build();
    }
    finally
    {
      conexion.close();
    }
  }

  @POST
  @Path("compra_articulo")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public Response compraArticulo(String json) throws Exception
  {
    ParamCompraArticulo p = (ParamCompraArticulo) j.fromJson(json, ParamCompraArticulo.class);
    
    Connection conexion = pool.getConnection();

    // Validación de parámetros
    if (p.id_articulo == null)
      return Response.status(400).entity(j.toJson(new Error("Se debe proporcionar el ID del artículo"))).build();
      
    if (p.cantidad == null || p.cantidad <= 0)
      return Response.status(400).entity(j.toJson(new Error("La cantidad debe ser mayor a cero"))).build();
      
    if (p.id_usuario == null)
      return Response.status(400).entity(j.toJson(new Error("Se debe proporcionar el ID de usuario"))).build();
      
    if (p.token == null || p.token.equals(""))
      return Response.status(400).entity(j.toJson(new Error("Se debe proporcionar el token de autenticación"))).build();

    try
    {
      // Verificar que el token corresponda al id_usuario
      PreparedStatement stmt_token = conexion.prepareStatement("SELECT token FROM usuarios WHERE id_usuario=?");
      try
      {
        stmt_token.setInt(1, p.id_usuario);
        ResultSet rs = stmt_token.executeQuery();
        
        if (!rs.next())
          return Response.status(401).entity(j.toJson(new Error("El usuario no existe"))).build();
          
        String token_guardado = rs.getString("token");
        rs.close();
        
        if (token_guardado == null || !token_guardado.equals(p.token))
          return Response.status(401).entity(j.toJson(new Error("Token inválido"))).build();
      }
      finally
      {
        stmt_token.close();
      }

      // Iniciar transacción
      conexion.setAutoCommit(false);
      
      try
      {
        // Verificar si hay suficiente stock
        PreparedStatement stmt_stock = conexion.prepareStatement("SELECT cantidad FROM stock WHERE id_articulo=? FOR UPDATE");
        stmt_stock.setInt(1, p.id_articulo);
        ResultSet rs_stock = stmt_stock.executeQuery();
        
        if (!rs_stock.next())
        {
          conexion.rollback();
          return Response.status(400).entity(j.toJson(new Error("El artículo no existe"))).build();
        }
        
        int cantidad_disponible = rs_stock.getInt("cantidad");
        rs_stock.close();
        stmt_stock.close();
        
        // Verificar si hay suficiente stock
        if (p.cantidad > cantidad_disponible)
        {
          conexion.rollback();
          return Response.status(400).entity(j.toJson(new Error("No hay suficientes artículos"))).build();
        }
        
        // Insertar en carrito_compra
        PreparedStatement stmt_carrito = conexion.prepareStatement(
          "INSERT INTO carrito_compra(id_usuario, id_articulo, cantidad) VALUES (?, ?, ?) " +
          "ON DUPLICATE KEY UPDATE cantidad = cantidad + ?");
        
        stmt_carrito.setInt(1, p.id_usuario);
        stmt_carrito.setInt(2, p.id_articulo);
        stmt_carrito.setInt(3, p.cantidad);
        stmt_carrito.setInt(4, p.cantidad);
        
        stmt_carrito.executeUpdate();
        stmt_carrito.close();
        
        // Actualizar el stock
        PreparedStatement stmt_update = conexion.prepareStatement(
          "UPDATE stock SET cantidad = cantidad - ? WHERE id_articulo = ?");
        
        stmt_update.setInt(1, p.cantidad);
        stmt_update.setInt(2, p.id_articulo);
        
        stmt_update.executeUpdate();
        stmt_update.close();
        
        // Confirmar la transacción
        conexion.commit();
        
        return Response.ok().build();
      }
      catch (Exception e)
      {
        // Deshacer la transacción en caso de error
        conexion.rollback();
        throw e;
      }
    }
    catch (Exception e)
    {
      return Response.status(400).entity(j.toJson(new Error(e.getMessage()))).build();
    }
    finally
    {
      try
      {
        conexion.setAutoCommit(true);
        conexion.close();
      }
      catch (Exception e)
      {
        // Ignorar errores al cerrar la conexión
      }
    }
  }

  @POST
  @Path("elimina_articulo_carrito_compra")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public Response eliminaArticuloCarritoCompra(String json) throws Exception
  {
    ParamEliminaArticuloCarrito p = (ParamEliminaArticuloCarrito) j.fromJson(json, ParamEliminaArticuloCarrito.class);
    
    Connection conexion = pool.getConnection();

    // Validación de parámetros
    if (p.id_usuario == null)
      return Response.status(400).entity(j.toJson(new Error("Se debe proporcionar el ID de usuario"))).build();
      
    if (p.id_articulo == null)
      return Response.status(400).entity(j.toJson(new Error("Se debe proporcionar el ID del artículo"))).build();
      
    if (p.token == null || p.token.equals(""))
      return Response.status(400).entity(j.toJson(new Error("Se debe proporcionar el token de autenticación"))).build();

    try
    {
      // Verificar que el token corresponda al id_usuario
      PreparedStatement stmt_token = conexion.prepareStatement("SELECT token FROM usuarios WHERE id_usuario=?");
      try
      {
        stmt_token.setInt(1, p.id_usuario);
        ResultSet rs = stmt_token.executeQuery();
        
        if (!rs.next())
          return Response.status(401).entity(j.toJson(new Error("El usuario no existe"))).build();
          
        String token_guardado = rs.getString("token");
        rs.close();
        
        if (token_guardado == null || !token_guardado.equals(p.token))
          return Response.status(401).entity(j.toJson(new Error("Token inválido"))).build();
      }
      finally
      {
        stmt_token.close();
      }

      // Iniciar transacción
      conexion.setAutoCommit(false);
      
      try
      {
        // Primero, obtener la cantidad de artículos en el carrito
        PreparedStatement stmt_cantidad = conexion.prepareStatement(
          "SELECT cantidad FROM carrito_compra WHERE id_usuario=? AND id_articulo=?");
        
        stmt_cantidad.setInt(1, p.id_usuario);
        stmt_cantidad.setInt(2, p.id_articulo);
        
        ResultSet rs_cantidad = stmt_cantidad.executeQuery();
        
        // Si no existe el artículo en el carrito, devolver error
        if (!rs_cantidad.next())
        {
          conexion.rollback();
          return Response.status(400).entity(j.toJson(new Error("El artículo no existe en el carrito de compra"))).build();
        }
        
        // Obtener la cantidad que se devolverá al stock
        int cantidad_a_devolver = rs_cantidad.getInt("cantidad");
        rs_cantidad.close();
        stmt_cantidad.close();
        
        // Actualizar el stock (devolver los artículos)
        PreparedStatement stmt_update = conexion.prepareStatement(
          "UPDATE stock SET cantidad = cantidad + ? WHERE id_articulo = ?");
        
        stmt_update.setInt(1, cantidad_a_devolver);
        stmt_update.setInt(2, p.id_articulo);
        
        int filas_actualizadas = stmt_update.executeUpdate();
        stmt_update.close();
        
        // Verificar que el artículo exista en stock
        if (filas_actualizadas == 0)
        {
          conexion.rollback();
          return Response.status(400).entity(j.toJson(new Error("El artículo no existe en el inventario"))).build();
        }
        
        // Eliminar el artículo del carrito
        PreparedStatement stmt_delete = conexion.prepareStatement(
          "DELETE FROM carrito_compra WHERE id_usuario=? AND id_articulo=?");
        
        stmt_delete.setInt(1, p.id_usuario);
        stmt_delete.setInt(2, p.id_articulo);
        
        stmt_delete.executeUpdate();
        stmt_delete.close();
        
        // Confirmar la transacción
        conexion.commit();
        
        return Response.ok().build();
      }
      catch (Exception e)
      {
        // Deshacer la transacción en caso de error
        conexion.rollback();
        throw e;
      }
    }
    catch (Exception e)
    {
      return Response.status(400).entity(j.toJson(new Error(e.getMessage()))).build();
    }
    finally
    {
      try
      {
        conexion.setAutoCommit(true);
        conexion.close();
      }
      catch (Exception e)
      {
        // Ignorar errores al cerrar la conexión
      }
    }
  }
  @POST
  @Path("elimina_carrito_compra")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public Response eliminaCarritoCompra(String json) throws Exception
  {
    ParamEliminaCarrito p = (ParamEliminaCarrito) j.fromJson(json, ParamEliminaCarrito.class);
    
    Connection conexion = pool.getConnection();

    // Validación de parámetros
    if (p.id_usuario == null)
      return Response.status(400).entity(j.toJson(new Error("Se debe proporcionar el ID de usuario"))).build();
      
    if (p.token == null || p.token.equals(""))
      return Response.status(400).entity(j.toJson(new Error("Se debe proporcionar el token de autenticación"))).build();

    try
    {
      // Verificar que el token corresponda al id_usuario
      PreparedStatement stmt_token = conexion.prepareStatement("SELECT token FROM usuarios WHERE id_usuario=?");
      try
      {
        stmt_token.setInt(1, p.id_usuario);
        ResultSet rs = stmt_token.executeQuery();
        
        if (!rs.next())
          return Response.status(401).entity(j.toJson(new Error("El usuario no existe"))).build();
          
        String token_guardado = rs.getString("token");
        rs.close();
        
        if (token_guardado == null || !token_guardado.equals(p.token))
          return Response.status(401).entity(j.toJson(new Error("Token inválido"))).build();
      }
      finally
      {
        stmt_token.close();
      }

      // Iniciar transacción
      conexion.setAutoCommit(false);
      
      try
      {
        // Obtener todos los artículos en el carrito del usuario
        PreparedStatement stmt_carrito = conexion.prepareStatement(
          "SELECT id_articulo, cantidad FROM carrito_compra WHERE id_usuario=?");
        
        stmt_carrito.setInt(1, p.id_usuario);
        ResultSet rs_carrito = stmt_carrito.executeQuery();
        
        // Preparar la sentencia para actualizar el stock
        PreparedStatement stmt_update = conexion.prepareStatement(
          "UPDATE stock SET cantidad = cantidad + ? WHERE id_articulo = ?");
        
        // Variable para verificar si había artículos en el carrito
        boolean hayArticulos = false;
        
        // Devolver cada artículo al stock
        while (rs_carrito.next())
        {
          hayArticulos = true;
          int id_articulo = rs_carrito.getInt("id_articulo");
          int cantidad = rs_carrito.getInt("cantidad");
          
          // Actualizar el stock
          stmt_update.setInt(1, cantidad);
          stmt_update.setInt(2, id_articulo);
          stmt_update.executeUpdate();
          
          // Limpiar parámetros para la siguiente iteración
          stmt_update.clearParameters();
        }
        
        // Cerrar recursos
        rs_carrito.close();
        stmt_carrito.close();
        stmt_update.close();
        
        // Eliminar todos los artículos del carrito del usuario
        PreparedStatement stmt_delete = conexion.prepareStatement(
          "DELETE FROM carrito_compra WHERE id_usuario=?");
        
        stmt_delete.setInt(1, p.id_usuario);
        stmt_delete.executeUpdate();
        stmt_delete.close();
        
        // Confirmar la transacción
        conexion.commit();
        
        // Si no había artículos, informar al cliente
        if (!hayArticulos) {
          return Response.status(200).entity(j.toJson(new Respuesta("El carrito ya estaba vacío"))).build();
        }
        
        return Response.ok().build();
      }
      catch (Exception e)
      {
        // Deshacer la transacción en caso de error
        conexion.rollback();
        throw e;
      }
    }
    catch (Exception e)
    {
      return Response.status(400).entity(j.toJson(new Error(e.getMessage()))).build();
    }
    finally
    {
      try
      {
        conexion.setAutoCommit(true);
        conexion.close();
      }
      catch (Exception e)
      {
        // Ignorar errores al cerrar la conexión
      }
    }
  }

  // Clase para respuestas informativas
  class Respuesta
  {
    String mensaje;
    
    public Respuesta(String mensaje)
    {
      this.mensaje = mensaje;
    }
  }

  @POST
  @Path("login")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public Response login(String json) throws Exception
  {
    ParamLogin p = (ParamLogin) j.fromJson(json, ParamLogin.class);
    
    // Validación de parámetros
    if (p.email == null || p.email.equals(""))
      return Response.status(400).entity(j.toJson(new Error("Se debe proporcionar el email"))).build();
      
    if (p.password == null || p.password.equals(""))
      return Response.status(400).entity(j.toJson(new Error("Se debe proporcionar la contraseña"))).build();
    
    Connection conexion = pool.getConnection();
    
    try
    {
      // Buscar el usuario con el email y password proporcionados
      PreparedStatement stmt = conexion.prepareStatement(
        "SELECT id_usuario, nombre FROM usuarios WHERE email=? AND password=?");
      
      stmt.setString(1, p.email);
      stmt.setString(2, p.password);
      
      ResultSet rs = stmt.executeQuery();
      
      // Si no se encuentra el usuario, devolver un token vacío
      if (!rs.next())
      {
        rs.close();
        stmt.close();
        
        RespuestaLogin respuesta = new RespuestaLogin();
        respuesta.token = "";
        respuesta.nombre = "";
        
        return Response.status(401).entity(j.toJson(respuesta)).build();
      }
      
      // Obtener el ID y nombre del usuario
      int id_usuario = rs.getInt("id_usuario");
      String nombre = rs.getString("nombre");
      
      rs.close();
      stmt.close();
      
      // Generar un token aleatorio de 20 caracteres
      String token = generarTokenAleatorio(20);
      
      // Actualizar el token en la base de datos
      PreparedStatement stmt_update = conexion.prepareStatement(
        "UPDATE usuarios SET token=? WHERE id_usuario=?");
      
      stmt_update.setString(1, token);
      stmt_update.setInt(2, id_usuario);
      
      stmt_update.executeUpdate();
      stmt_update.close();
      
      // Crear la respuesta
      RespuestaLogin respuesta = new RespuestaLogin();
      respuesta.token = token;
      respuesta.nombre = nombre;
      
      return Response.ok(j.toJson(respuesta)).build();
    }
    catch (Exception e)
    {
      return Response.status(500).entity(j.toJson(new Error(e.getMessage()))).build();
    }
    finally
    {
      conexion.close();
    }
  }

  // Método para generar un token aleatorio
  private String generarTokenAleatorio(int longitud)
  {
    // Caracteres que pueden formar parte del token
    String caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    StringBuilder token = new StringBuilder();
    
    // Generar un objeto Random con semilla basada en el tiempo actual
    Random random = new Random(System.currentTimeMillis());
    
    // Generar el token seleccionando caracteres aleatorios
    for (int i = 0; i < longitud; i++)
    {
      int indice = random.nextInt(caracteres.length());
      token.append(caracteres.charAt(indice));
    }
    
    return token.toString();
  }
}
