# Datos pendientes para completar la lista del equipo

La UI está preparada y verificada con el contrato actual; no se han inventado cifras ni ampliado el backend en esta iteración.

1. Entregar goles y asistencias por integrante en un DTO agregado del plantel. Precisar el alcance: trayectoria completa o partidos con este equipo. La UI actual deja ambos como «Sin datos».
2. Entregar partidos jugados con el equipo si esa es la métrica deseada. Actualmente se muestra `OverallRating.totalMatchesPlayed` con etiqueta «PJ totales», sin atribuir esos partidos al equipo.
3. Definir la fuente de resultados válidos y participación para estos acumulados, conservando autorización y jugadores confirmados. Diferenciar cero registrado, ausencia de historial y fallo de carga. Mantener compatibilidad con los consumidores existentes.
4. Para la beta, comprobar con datos reales el conjunto de integrantes activos y su OVR. Confirmar el criterio de promedio: se incluyen ceros válidos y se excluyen valores ausentes/errores con cobertura visible. Si se necesita un OVR oficial persistido o una instantánea histórica, calcularlo/versionarlo en backend; el actual es una media de presentación.

El hexágono usa las medias por posición de `roleBreakdown`, no seis copias del OVR escalar. El endpoint de valoración existente ya entrega ese desglose. La consulta por integrante es la preexistente; no se añadieron peticiones para intentar derivar goles de historiales privados.
