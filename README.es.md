[English](./README.md) | **Español**

# Plugins de aantars

Plugins de Claude Code que uso en el día a día, empaquetados como un marketplace que puedes instalar desde la terminal o desde la app Claude Desktop.

El primero es **usage-limits-band**: una pequeña franja encima de la caja de texto en la pestaña **Code** de Desktop para tener el uso siempre a la vista. Muestra el repo y la rama de git en los que estás, cuánto llevas ocupado de la ventana de contexto y tus límites de 5 horas y semanal, con una estimación de cuándo llegarás a cada uno al ritmo actual. Irán llegando más plugins.

## Instalación

Estos plugins son mods: funcionan sobre la API de hooks de Claude Code, así que sirven en Claude Code (terminal y pestaña Code de Desktop) y no en Codex ni en otros agentes. Esa API está en acceso anticipado y puede cambiar entre versiones de Claude Code.

<details>
<summary><strong>Claude Code (CLI)</strong></summary>

```bash
claude plugin marketplace add aantars/plugins
claude plugin install usage-limits-band@aantars-plugins
```

Si lo instalas con el ámbito de usuario, el plugin también se carga en las sesiones que abre la app de Desktop.

</details>

<details>
<summary><strong>Claude Code (dentro de una sesión)</strong></summary>

```text
/plugin marketplace add aantars/plugins
/plugin install usage-limits-band@aantars-plugins
```

Después ejecuta `/reload-plugins` o abre una sesión nueva.

</details>

<details>
<summary><strong>Claude Desktop (pestaña Code)</strong></summary>

1. Abre **Customize**, selecciona **Plugins** y luego **Add** > **Add marketplace**.
2. Añade `aantars/plugins`.
3. Busca **usage-limits-band** en la lista e instálalo.
4. Abre o reanuda una sesión de **Code** (no Chat ni Cowork).

</details>

<details>
<summary><strong>Ejecutarlo desde una carpeta local</strong> (para probar cambios)</summary>

Para probar un cambio antes de publicarlo, apunta Claude Code a la carpeta del plugin en lugar de instalarlo: `claude --plugin-dir <carpeta>` para una sesión de terminal, o `CLAUDE_CODE_PLUGIN_DIRS` en el bloque `env` de `~/.claude/settings.json` para todas las sesiones, incluidas las de Desktop. No lo combines con una copia instalada del mismo plugin, o se cargará dos veces.

</details>

## Referencia

### Productividad

Herramientas para el trabajo diario, no específicas de programación.

- **[usage-limits-band](./plugins/productivity/usage-limits-band)**: Franja siempre visible en la pestaña Code de Desktop con el repo, la rama, el contexto ocupado y los límites de 5 horas y semanal, con una estimación de cuándo llegarás a ellos. En la terminal no aparece, porque ahí ya está tu status line. [Documentación](./docs/productivity/usage-limits-band.es.md)

## Actualizar y desinstalar

| Vía | Actualizar | Desinstalar |
| --- | --- | --- |
| Claude Code | `claude plugin marketplace update aantars-plugins` y después `claude plugin update usage-limits-band@aantars-plugins`. O activa la actualización automática del marketplace `aantars-plugins` en `/plugin` > **Marketplaces**. | `claude plugin uninstall usage-limits-band@aantars-plugins` y después `claude plugin marketplace remove aantars-plugins` |
| Claude Desktop | **Customize** > **Plugins**, abre **usage-limits-band** y actualízalo | En el mismo sitio, desinstálalo |

## Licencia

[MIT](./LICENSE)
