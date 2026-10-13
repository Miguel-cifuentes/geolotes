# GeoLotes

> Tu próximo lote está aquí.

Plataforma web para la exploración y comercialización digital de lotes mediante
un mapa interactivo con disponibilidad en tiempo real. Primera versión: sector
La Porfía, Villavicencio (Meta).

## Problema
- Planos en PDF difíciles de interpretar
- Disponibilidad consultada manualmente
- Información dispersa
- Experiencia de compra limitada

## Solución
- Mapa interactivo de lotes por estado (disponible, reservado, vendido, no disponible)
- Vista satelital y 3D con Mapbox
- Ficha de cada lote con información y documentos
- Agendamiento de visitas y contacto con el vendedor

## Arquitectura (orientada a servicios)
| Componente | Tecnología |
|---|---|
| frontend | React + Vite + TypeScript + Mapbox GL |
| gateway | Spring Cloud Gateway |
| lotes-service | Spring Boot + PostgreSQL/PostGIS |
| visitas-service | Spring Boot + PostgreSQL |

## Equipo
- Miguel Cifuentes — CEO
- David Viasus — CTO

## Cómo ejecutar
_En construcción._