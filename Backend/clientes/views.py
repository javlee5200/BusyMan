from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.viewsets import ModelViewSet
from drf_spectacular.utils import OpenApiExample, extend_schema, extend_schema_view

from .models import Cliente
from .permissions import ClienteGroupPermission
from .serializers import ClienteSerializer


@extend_schema_view(
	list=extend_schema(
		tags=["Clientes"],
		summary="Listar clientes",
		description="Retorna el listado de clientes registrados.",
	),
	retrieve=extend_schema(
		tags=["Clientes"],
		summary="Obtener cliente",
		description="Retorna el detalle de un cliente por ID.",
	),
	create=extend_schema(
		tags=["Clientes"],
		summary="Crear cliente",
		description="Crea un nuevo cliente.",
		examples=[
			OpenApiExample(
				"Crear cliente - request",
				value={
					"nombres": "Juan",
					"apellidos": "Pérez",
					"tipo_documento": "CC",
					"numero_documento": "123456789",
					"telefono": "3001234567",
					"email": "juan.perez@example.com",
					"direccion": "Calle 123",
					"activo": True,
				},
				request_only=True,
			),
			OpenApiExample(
				"Crear cliente - response",
				value={
					"id": 1,
					"nombres": "Juan",
					"apellidos": "Pérez",
					"tipo_documento": "CC",
					"numero_documento": "123456789",
					"telefono": "3001234567",
					"email": "juan.perez@example.com",
					"direccion": "Calle 123",
					"activo": True,
					"fecha_registro": "2026-02-18T10:00:00Z",
					"fecha_actualizacion": "2026-02-18T10:00:00Z",
				},
				response_only=True,
			),
		],
	),
	partial_update=extend_schema(
		tags=["Clientes"],
		summary="Actualizar cliente (parcial)",
		description="Actualiza parcialmente un cliente existente.",
		examples=[
			OpenApiExample(
				"Actualizar cliente - request",
				value={
					"telefono": "3015550000",
					"direccion": "Carrera 45 #10-20",
				},
				request_only=True,
			),
		],
	),
	update=extend_schema(
		tags=["Clientes"],
		summary="Actualizar cliente",
		description="Actualiza completamente un cliente existente.",
	),
	destroy=extend_schema(
		tags=["Clientes"],
		summary="Eliminar cliente",
		description="Elimina un cliente por ID (según permisos del rol).",
	),
)
class ClienteViewSet(ModelViewSet):
	queryset = Cliente.objects.all()
	serializer_class = ClienteSerializer
	permission_classes = [IsAuthenticated, ClienteGroupPermission]
	filter_backends = [SearchFilter, OrderingFilter]
	search_fields = ["nombres", "apellidos", "numero_documento", "telefono", "email"]
	ordering_fields = ["fecha_registro", "nombres", "apellidos", "numero_documento"]
	ordering = ["-fecha_registro"]
