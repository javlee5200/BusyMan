from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import OrdenTrabajoViewSet

router = DefaultRouter()
router.register(r"ordenes", OrdenTrabajoViewSet, basename="ordenes")

urlpatterns = [
    path("", include(router.urls)),
]
