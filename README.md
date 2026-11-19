# Pizza's Bob — sitio web y administrador

Sitio estático en HTML, CSS y JavaScript para publicar gratuitamente en GitHub Pages. Incluye una carta con 65 referencias transcritas de las imágenes entregadas, buscador, filtros, galería, carrito que prepara pedidos por WhatsApp y administrador independiente para modificar los datos.

## Archivos del proyecto

```text
index.html               Página pública
admin.html               Administrador de catálogo
assets/css/              Estilos
assets/js/               Funcionalidad pública y administrativa
assets/img/              Fotografías optimizadas del establecimiento
data/catalogo.json       Archivo editable con nombres, precios y descripciones
```

Las fotografías se muestran como ilustraciones de la categoría; pueden no corresponder exactamente a la variedad seleccionada. El precio del domicilio no está incluido en el subtotal, y no se procesa ningún pago desde el sitio.

## Publicar en GitHub Pages

1. Accede a [GitHub](https://github.com) con la cuenta que administrará el negocio.
2. Crea un repositorio nuevo, por ejemplo `pizzas-bob`. Con GitHub Free, utiliza un repositorio público para Pages.
3. Descomprime el ZIP. Sube **el contenido de la carpeta** a la raíz del repositorio: `index.html` debe verse inmediatamente en la primera pantalla del repositorio. No subas una carpeta exterior adicional.
4. En GitHub, entra en **Settings → Pages**.
5. En **Build and deployment → Source**, selecciona **Deploy from a branch**; elige `main` y `/(root)`; guarda.
6. Espera la publicación. La dirección normalmente será `https://USUARIO.github.io/pizzas-bob/`, sustituyendo el usuario y el nombre reales del repositorio.
7. Prueba el menú, el carrito, las fotografías y el administrador desde la dirección publicada.

Guía oficial: https://docs.github.com/es/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Cambiar precios con el administrador

1. Abre `https://USUARIO.github.io/pizzas-bob/admin.html`.
2. Selecciona un producto para editarlo; también puedes crear, ocultar o eliminar productos.
3. Si aún no conectaste GitHub, presiona **Descargar JSON actualizado** y reemplaza manualmente `data/catalogo.json` en el repositorio.
4. Si deseas publicar directamente desde el navegador, crea un token **fine-grained** en GitHub con acceso exclusivo al repositorio y permiso **Contents: Read and write**. Define una fecha de vencimiento corta.
5. En **Conectar con GitHub**, introduce el propietario (usuario u organización), nombre del repositorio, rama y token. Presiona **Conectar y cargar catálogo remoto**.
6. Modifica los productos y pulsa **Publicar cambios en GitHub**. El panel actualiza `data/catalogo.json` mediante la API de GitHub, comprobando la versión SHA del archivo para detectar conflictos.
7. Desconecta al terminar. El token no se guarda en archivos, enlaces, commits, cookies ni `localStorage`; solo está en memoria durante esa sesión.

**Seguridad:** `admin.html` es una interfaz pública. No existe una autenticación privada en un sitio estático: cualquier persona puede verla, pero nadie puede cambiar el repositorio sin un token autorizado. No compartas ese token con clientes ni lo incluyas en capturas. La integración remota requiere una prueba real después de configurar tu repositorio y token.

Guía oficial sobre tokens: https://docs.github.com/es/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

## Probar en el computador

En Windows, haz doble clic en `INICIAR-VISTA-PREVIA.bat` si tienes Python instalado. El navegador abrirá el sitio localmente; el administrador estará en `http://localhost:8000/admin.html`.

Por seguridad del navegador, los archivos JSON locales no deben abrirse mediante `file://` para probar `fetch()`. Alternativamente, desde la carpeta del proyecto, ejecuta este servidor gratuito:

```bash
python -m http.server 8000
```

Después visita `http://localhost:8000/` y `http://localhost:8000/admin.html`.

## Datos por confirmar con el negocio

- Dirección exacta de la sede y enlace oficial a mapas.
- Horarios de atención y zonas de domicilio.
- Redes sociales oficiales.
- Confirmación final de precios y disponibilidad, porque la carta suministrada está impresa y algunos precios fueron actualizados a mano.

El botón de pedidos utiliza el número de domicilios visible en la carta impresa: **+57 321 301 3467**. No se inventaron otros teléfonos, direcciones ni horarios.
