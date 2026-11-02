# Supabase
1. supabase.com > New project. 2. SQL Editor: pega y ejecuta supabase/schema.sql (tabla preferences + RLS: cada usuario solo ve/edita su fila).
3. Settings > API: copia "Project URL" y la clave anon/publishable en js/config.js. NUNCA la service_role.
4. Authentication > Providers > Email activado. Si desactivas "Confirm email", el registro entra directo; si no, confirma el correo y luego inicia sesión.
5. Authentication > URL Configuration: añade la URL de tu GitHub Pages en Site URL.
Qué se sincroniza: tema, horarios, clima, categorías, listas por situación, preferencias de reproducción y favoritas (por título+artista). Nunca audio.
