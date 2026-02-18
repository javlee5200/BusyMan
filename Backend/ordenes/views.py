from django.utils import timezone
from drf_spectacular.utils import OpenApiExample, OpenApiParameter, extend_schema, extend_schema_view
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from .models import HistorialOrden, OrdenTrabajo
from .permissions import OrdenesGroupPermission
from .serializers import OrdenTrabajoSerializer


@extend_schema_view(
	list=extend_schema(
		tags=["Órdenes"],
		summary="Listar órdenes de trabajo",
		description="Retorna el listado de órdenes con filtros por estado, técnico y equipo.",
		parameters=[
			OpenApiParameter(name="estado", required=False, type=str, description="Filtrar por estado de la orden"),
			OpenApiParameter(name="tecnico_id", required=False, type=int, description="Filtrar por técnico asignado"),
			OpenApiParameter(name="equipo_id", required=False, type=int, description="Filtrar por equipo"),
		],
	),
	create=extend_schema(
		tags=["Órdenes"],
		summary="Crear orden de trabajo",
		description="Registra una nueva orden y genera trazabilidad inicial en historial.",
		examples=[
			OpenApiExample(
				"Crear orden - request",
				value={
					"equipo": 1,
					"tecnico_asignado": 2,
					"descripcion_falla": "No enciende",
					"diagnostico": "",
					"solucion": "",
					"costo_estimado": "50000.00",
					"costo_final": "0.00",
					"estado": "INGRESADO",
				},
				request_only=True,
			),
		],
	),
	partial_update=extend_schema(
		tags=["Órdenes"],
		summary="Actualizar orden (parcial)",
		description="Actualiza una orden. Si cambia el estado, se registra en historial automáticamente.",
		examples=[
			OpenApiExample(
				"Cambio de estado",
				value={"estado": "DIAGNOSTICO", "diagnostico": "Se detecta falla de fuente"},
				request_only=True,
			),
		],
	),
	retrieve=extend_schema(tags=["Órdenes"], summary="Obtener orden", description="Detalle de la orden con historial."),
	update=extend_schema(tags=["Órdenes"], summary="Actualizar orden", description="Actualiza completamente una orden."),
	destroy=extend_schema(tags=["Órdenes"], summary="Eliminar orden", description="Elimina una orden (solo admin)."),
)
class OrdenTrabajoViewSet(ModelViewSet):
	queryset = OrdenTrabajo.objects.select_related(
		"equipo",
		"equipo__cliente",
		"recepcionista",
		"tecnico_asignado",
	).prefetch_related("historial", "historial__usuario")
	serializer_class = OrdenTrabajoSerializer
	permission_classes = [IsAuthenticated, OrdenesGroupPermission]
	filter_backends = [SearchFilter, OrderingFilter]
	search_fields = [
		"equipo__marca",
		"equipo__modelo",
		"equipo__cliente__nombres",
		"equipo__cliente__apellidos",
		"descripcion_falla",
	]
	ordering_fields = ["fecha_creacion", "estado", "costo_estimado", "costo_final"]
	ordering = ["-fecha_creacion"]

	def get_queryset(self):
		queryset = super().get_queryset()
		estado = self.request.query_params.get("estado")
		tecnico_id = self.request.query_params.get("tecnico_id")
		equipo_id = self.request.query_params.get("equipo_id")

		if estado:
			queryset = queryset.filter(estado=estado)
		if tecnico_id:
			queryset = queryset.filter(tecnico_asignado_id=tecnico_id)
		if equipo_id:
			queryset = queryset.filter(equipo_id=equipo_id)

		return queryset

	def perform_create(self, serializer):
		orden = serializer.save(recepcionista=self.request.user)
		HistorialOrden.objects.create(
			orden=orden,
			estado_anterior="",
			estado_nuevo=orden.estado,
			comentario="Creación de orden",
			usuario=self.request.user,
		)

	def perform_update(self, serializer):
		orden_actual = self.get_object()
		estado_anterior = orden_actual.estado
		orden = serializer.save()

		if estado_anterior != orden.estado:
			HistorialOrden.objects.create(
				orden=orden,
				estado_anterior=estado_anterior,
				estado_nuevo=orden.estado,
				comentario=f"Cambio de estado: {estado_anterior} -> {orden.estado}",
				usuario=self.request.user,
			)

		if orden.estado == "ENTREGADO" and not orden.fecha_entrega:
			orden.fecha_entrega = timezone.now()
			orden.save(update_fields=["fecha_entrega"])
