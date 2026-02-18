from django.urls import path

from .views import ConsumoRepuestosReporteView, OrdenesPorEstadoReporteView, OrdenesPorTecnicoReporteView

urlpatterns = [
    path("reportes/ordenes-por-estado/", OrdenesPorEstadoReporteView.as_view(), name="reporte-ordenes-por-estado"),
    path("reportes/ordenes-por-tecnico/", OrdenesPorTecnicoReporteView.as_view(), name="reporte-ordenes-por-tecnico"),
    path("reportes/consumo-repuestos/", ConsumoRepuestosReporteView.as_view(), name="reporte-consumo-repuestos"),
]
