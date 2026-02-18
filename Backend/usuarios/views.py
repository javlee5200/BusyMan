from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated

from .permissions import UsuariosGroupPermission
from .serializers import TecnicoComboSerializer


@extend_schema(
	tags=["Usuarios"],
	summary="Listar técnicos para combo",
	description="Retorna usuarios activos del grupo Técnico con datos mínimos para selects en frontend.",
)
class TecnicosComboListView(ListAPIView):
	serializer_class = TecnicoComboSerializer
	permission_classes = [IsAuthenticated, UsuariosGroupPermission]

	def get_queryset(self):
		return (
			User.objects.filter(is_active=True, groups__name="Técnico")
			.distinct()
			.order_by("first_name", "last_name", "username")
		)
