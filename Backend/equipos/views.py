from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from drf_spectacular.utils import OpenApiExample, OpenApiParameter, extend_schema, extend_schema_view

from .models import Equipo
from .permissions import EquipoGroupPermission
from .serializers import EquipoSerializer


@extend_schema_view(
	list=extend_schema(
		tags=["Equipos"],
		summary="Listar equipos",
		description="Retorna el listado de equipos. Permite filtros por query params.",
		parameters=[
			OpenApiParameter(name="cliente_id", description="Filtrar por ID de cliente", required=False, type=int),
			OpenApiParameter(name="estado", description="Filtrar por estado actual", required=False, type=str),
			OpenApiParameter(name="tipo_equipo", description="Filtrar por tipo de equipo", required=False, type=str),
			OpenApiParameter(name="numero_serie", description="Filtrar por coincidencia en número de serie", required=False, type=str),
		],
	),
	retrieve=extend_schema(
		tags=["Equipos"],
		summary="Obtener equipo",
		description="Retorna el detalle de un equipo por ID.",
	),
	create=extend_schema(
		tags=["Equipos"],
		summary="Crear equipo",
		description="Registra un nuevo equipo asociado a un cliente.",
		examples=[
			OpenApiExample(
				"Crear equipo - request",
				value={
					"cliente": 1,
					"tipo_equipo": "PORTATIL",
					"marca": "Lenovo",
					"modelo": "ThinkPad E14",
					"numero_serie": "SN-001-BM",
					"accesorios_recibidos": "Cargador",
					"estado_fisico": "Buen estado",
					"problema_reportado": "No enciende",
					"estado_actual": "INGRESADO",
				},
				request_only=True,
			),
			OpenApiExample(
				"Crear equipo - response",
				value={
					"id": 1,
					"cliente": 1,
					"cliente_nombre": "Juan",
					"cliente_apellido": "Pérez",
					"tipo_equipo": "PORTATIL",
					"marca": "Lenovo",
					"modelo": "ThinkPad E14",
					"numero_serie": "SN-001-BM",
					"accesorios_recibidos": "Cargador",
					"estado_fisico": "Buen estado",
					"problema_reportado": "No enciende",
					"estado_actual": "INGRESADO",
					"fecha_ingreso": "2026-02-18T10:15:00Z",
					"fecha_actualizacion": "2026-02-18T10:15:00Z",
				},
				response_only=True,
			),
		],
	),
	partial_update=extend_schema(
		tags=["Equipos"],
		summary="Actualizar equipo (parcial)",
		description="Actualiza parcialmente un equipo existente.",
		examples=[
			OpenApiExample(
				"Actualizar equipo - request",
				value={
					"estado_actual": "DIAGNOSTICO",
				},
				request_only=True,
			),
		],
	),
	update=extend_schema(
		tags=["Equipos"],
		summary="Actualizar equipo",
		description="Actualiza completamente un equipo existente.",
	),
	destroy=extend_schema(
		tags=["Equipos"],
		summary="Eliminar equipo",
		description="Elimina un equipo por ID (según permisos del rol).",
	),
)
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
