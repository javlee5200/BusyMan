from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from .models import ConsumoOrden, MovimientoInventario, Repuesto
from .permissions import InventarioGroupPermission
from .serializers import ConsumoOrdenSerializer, MovimientoInventarioSerializer, RepuestoSerializer


@extend_schema_view(
	list=extend_schema(tags=["Inventario"], summary="Listar repuestos"),
	retrieve=extend_schema(tags=["Inventario"], summary="Obtener repuesto"),
	create=extend_schema(tags=["Inventario"], summary="Crear repuesto"),
	update=extend_schema(tags=["Inventario"], summary="Actualizar repuesto"),
	partial_update=extend_schema(tags=["Inventario"], summary="Actualizar repuesto (parcial)"),
	destroy=extend_schema(tags=["Inventario"], summary="Eliminar repuesto"),
)
class RepuestoViewSet(ModelViewSet):
	queryset = Repuesto.objects.all()
	serializer_class = RepuestoSerializer
	permission_classes = [IsAuthenticated, InventarioGroupPermission]
	filter_backends = [SearchFilter, OrderingFilter]
	search_fields = ["codigo", "nombre", "descripcion"]
	ordering_fields = ["nombre", "stock_actual", "fecha_creacion"]
	ordering = ["nombre"]


@extend_schema_view(
	list=extend_schema(
		tags=["Inventario"],
		summary="Listar movimientos de inventario",
		parameters=[
			OpenApiParameter(name="tipo", required=False, type=str, description="Filtrar por tipo de movimiento"),
			OpenApiParameter(name="repuesto_id", required=False, type=int, description="Filtrar por repuesto"),
		],
	),
	retrieve=extend_schema(tags=["Inventario"], summary="Obtener movimiento"),
	create=extend_schema(tags=["Inventario"], summary="Registrar movimiento manual"),
)
class MovimientoInventarioViewSet(ModelViewSet):
	queryset = MovimientoInventario.objects.select_related("repuesto", "usuario", "orden_referencia")
	serializer_class = MovimientoInventarioSerializer
	permission_classes = [IsAuthenticated, InventarioGroupPermission]
	filter_backends = [SearchFilter, OrderingFilter]
	search_fields = ["repuesto__codigo", "repuesto__nombre", "motivo"]
	ordering_fields = ["fecha", "cantidad"]
	ordering = ["-fecha"]

	def get_queryset(self):
		queryset = super().get_queryset()
		tipo = self.request.query_params.get("tipo")
		repuesto_id = self.request.query_params.get("repuesto_id")

		if tipo:
			queryset = queryset.filter(tipo=tipo)
		if repuesto_id:
			queryset = queryset.filter(repuesto_id=repuesto_id)

		return queryset


@extend_schema_view(
	list=extend_schema(
		tags=["Inventario"],
		summary="Listar consumos por órdenes",
		parameters=[
			OpenApiParameter(name="orden_id", required=False, type=int, description="Filtrar por orden"),
			OpenApiParameter(name="repuesto_id", required=False, type=int, description="Filtrar por repuesto"),
		],
	),
	retrieve=extend_schema(tags=["Inventario"], summary="Obtener consumo"),
	create=extend_schema(tags=["Inventario"], summary="Registrar consumo en orden"),
)
class ConsumoOrdenViewSet(ModelViewSet):
	queryset = ConsumoOrden.objects.select_related("orden", "repuesto", "usuario")
	serializer_class = ConsumoOrdenSerializer
	permission_classes = [IsAuthenticated, InventarioGroupPermission]
	filter_backends = [OrderingFilter]
	ordering_fields = ["fecha", "cantidad"]
	ordering = ["-fecha"]

	def get_queryset(self):
		queryset = super().get_queryset()
		orden_id = self.request.query_params.get("orden_id")
		repuesto_id = self.request.query_params.get("repuesto_id")

		if orden_id:
			queryset = queryset.filter(orden_id=orden_id)
		if repuesto_id:
			queryset = queryset.filter(repuesto_id=repuesto_id)

		return queryset
