## Qué hace

`usage-limits-band` te deja el uso de Claude a la vista mientras trabajas en la pestaña **Code** de Claude Desktop. Dibuja una pequeña franja encima de la caja de texto con el repo y la rama de git del chat que tienes delante, cuánto lleva ocupado su ventana de contexto y tus límites de 5 horas y semanal, cada uno con una estimación de cuándo se agotará al ritmo actual.

Solo muestra datos que da el propio Claude Code: los mismos datos de contexto y de límites que recibe la status line de la terminal. Si falta alguno (no hay repo, todavía no hay lectura de los límites), esa parte de la franja no aparece en lugar de inventarse.

## Dónde aparece

La franja se dibuja solo en la pestaña **Code** de Desktop. En la terminal no dibuja nada, así que no se duplica con la status line que ya tengas ahí.

```
acme-tools | feature/login | 85.3k ████░░░░░░                     [ Hide ]
🚀 5h ████░░░░░░ (42%) -> limit in 1h20m (Fri 17/10 14:00)
🌙 Weekly ██░░░░░░░░ (18%) -> ~limit in 4d5h (Mon 20/10 09:00)
```

Cada chat tiene su propia franja, calculada con la carpeta de ese chat, así que al cambiar de chat ves el repo y el contexto del otro.

## Requisitos

- `git` en el `PATH`, para el repo y la rama. Sin él, esas dos partes no aparecen y el resto funciona igual.
- Un plan de suscripción de Claude para las líneas de 5h y semanal. Con facturación por API no hay ventanas de límite que mostrar y esas líneas no aparecen.

## Cómo leer la franja

| Parte | Qué significa |
| --- | --- |
| Repo | Nombre de la carpeta raíz del repositorio git del directorio del chat |
| Rama | Rama actual, en gris; `(detached)` cuando HEAD no está en ninguna rama |
| Contexto | Tokens sobre los que se respondió la última vez, y una barra de 10 celdas con la parte usada de la ventana |
| 🚀 5h / 🌙 Weekly | Una barra de 10 celdas con la parte usada de la ventana y su porcentaje |
| `-> limit in 1h20m` | Cuánto falta para llegar al límite al ritmo actual, como mucho hasta el reinicio |
| `~` delante | Este chat aún no ha medido su ritmo, así que se usa el ritmo medio de la ventana |
| Hora entre paréntesis | Cuándo se reinicia la ventana, en tu hora local |
| `limit hit` | La ventana está agotada; el paréntesis indica cuándo se reinicia |

La barra de contexto se pone naranja en el último 10 % antes de un tamaño "óptimo" y roja al pasarlo. El tamaño óptimo es el menor entre la mitad de la ventana de contexto y 200 000 tokens. Puedes cambiar esos dos números con `CLAUDE_CTX_OPTIMAL_PCT` y `CLAUDE_CTX_OPTIMAL_TOKENS`.

El texto `limit in` es verde mientras el límite previsto queda lejos del reinicio, amarillo cuando cae antes del último 40 % del tiempo que queda y rojo cuando cae antes del último 10 %.

**Hide**, un botón pegado a la derecha de la primera línea, pliega la franja a un único botón **Show usage** en ese mismo sitio. La elección dura en ese chat; un chat nuevo empieza con la franja abierta.

## Preguntas frecuentes

**¿Por qué no aparecen los límites nada más abrir un chat?**
Los datos de los límites llegan con la primera respuesta. Hasta entonces solo se ven el repo, la rama y el contexto (si se conoce).

**¿Qué precisión tiene la estimación?**
Es una estimación lineal. Cada chat mide su propio ritmo desde que ve una ventana por primera vez; hasta que lleva al menos un minuto y algo de uso, recurre al ritmo medio de la ventana y lo marca con `~`. Una racha de trabajo intenso la mueve rápido.

**¿Ejecuta git todo el rato?**
No. Consulta git al empezar el chat, al volver a él, después de cada turno y cada 30 segundos, y reutiliza la respuesta durante 5 segundos. Nunca ejecuta git mientras dibuja, así que la interfaz no tiene que esperarle.

## Funciona bien si

- La primera línea muestra el repo y la rama que ves en la terminal para esa carpeta.
- Tras una respuesta aparecen las líneas de 5h y Weekly con porcentajes que coinciden con **Settings** > **Usage**.
- **Hide** pliega la franja y **Show usage** la vuelve a abrir.
- En una sesión de terminal la franja no aparece.

## Encaje

Un complemento independiente para la pestaña Code de Desktop. Muestra lo mismo que puede mostrar una [status line](https://code.claude.com/docs/en/statusline) en la terminal, en el sitio donde no hay status line.
