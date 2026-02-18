from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ConsumoOrdenViewSet, MovimientoInventarioViewSet, RepuestoViewSet

router = DefaultRouter()
router.register(r"repuestos", RepuestoViewSet, basename="repuestos")
router.register(r"inventario/movimientos", MovimientoInventarioViewSet, basename="inventario-movimientos")
router.register(r"inventario/consumos", ConsumoOrdenViewSet, basename="inventario-consumos")

urlpatterns = [
    path("", include(router.urls)),
]
