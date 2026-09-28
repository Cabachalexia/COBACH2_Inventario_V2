COBACH PLANTEL NOGALES II - INVENTARIO V2

Esta versión usa Supabase para autenticación y almacenamiento real del inventario.

PRUEBA RECOMENDADA
1. Para evitar restricciones del navegador al abrir archivos locales, sirva esta carpeta con un servidor web local.
   En Windows, si tiene Python instalado: python -m http.server 8000
   Luego abra: http://localhost:8000
2. Inicie sesión con el usuario administrador creado en Supabase.
3. Registre un equipo de prueba y confirme en Supabase > Table Editor > equipos.

SEGURIDAD
- La aplicación contiene únicamente la Project URL y la Publishable Key, que son datos de cliente.
- NO agregue service_role, secret keys ni la contraseña de PostgreSQL al código.
- El acceso a los datos está controlado mediante Supabase Auth + RLS.

ROLES
- administrador: consulta, alta, edición y eliminación.
- capturista: consulta, alta y edición.
- consulta: solo lectura.
