from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from .models import Equipo
from .permissions import EquipoGroupPermission
from .serializers import EquipoSerializer


class EquipoViewSet(ModelViewSet):
	queryset = Equipo.objects.select_related("cliente").all()
	serializer_class = EquipoSerializer
	permission_classes = [IsAuthenticated, EquipoGroupPermission]
	filter_backends = [SearchFilter, OrderingFilter]
	search_fields = [
		"cliente__nombres",
		"cliente__apellidos",
		"marca",
		"modelo",
		"numero_serie",
		"problema_reportado",
	]
	ordering_fields = ["fecha_ingreso", "marca", "modelo", "estado_actual"]
	ordering = ["-fecha_ingreso"]

	def get_queryset(self):
		queryset = super().get_queryset()
		cliente_id = self.request.query_params.get("cliente_id")
		estado = self.request.query_params.get("estado")
		tipo_equipo = self.request.query_params.get("tipo_equipo")
		numero_serie = self.request.query_params.get("numero_serie")

		if cliente_id:
			queryset = queryset.filter(cliente_id=cliente_id)
		if estado:
			queryset = queryset.filter(estado_actual=estado)
		if tipo_equipo:
			queryset = queryset.filter(tipo_equipo=tipo_equipo)
		if numero_serie:
			queryset = queryset.filter(numero_serie__icontains=numero_serie)

		return queryset
