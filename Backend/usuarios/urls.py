from django.urls import path

from .views import TecnicosComboListView


urlpatterns = [
    path("usuarios/tecnicos/", TecnicosComboListView.as_view(), name="usuarios-tecnicos-combo"),
]