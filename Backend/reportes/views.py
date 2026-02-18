from datetime import datetime, time

from django.db.models import Count, DecimalField, ExpressionWrapper, F, Sum
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import serializers
from rest_framework.views import APIView
from drf_spectacular.utils import inline_serializer

from inventario.models import ConsumoOrden
from ordenes.models import OrdenTrabajo
from .permissions import ReportesGroupPermission


class BaseReporteView(APIView):
	permission_classes = [IsAuthenticated, ReportesGroupPermission]

	def _parse_date_filters(self, request):
		fecha_inicio = request.query_params.get("fecha_inicio")
		fecha_fin = request.query_params.get("fecha_fin")
		filters = {}

		if fecha_inicio:
			inicio = datetime.combine(datetime.fromisoformat(fecha_inicio).date(), time.min)
			filters["fecha_creacion__gte"] = inicio

		if fecha_fin:
			fin = datetime.combine(datetime.fromisoformat(fecha_fin).date(), time.max)
			filters["fecha_creacion__lte"] = fin

		return filters


class OrdenesPorEstadoReporteView(BaseReporteView):
	@extend_schema(
		tags=["Reportes"],
		summary="Reporte de órdenes por estado",
		description="Retorna conteo de órdenes agrupadas por estado, con filtro opcional por rango de fechas.",
		parameters=[
			OpenApiParameter(name="fecha_inicio", type=str, required=False, description="Formato YYYY-MM-DD"),
			OpenApiParameter(name="fecha_fin", type=str, required=False, description="Formato YYYY-MM-DD"),
		],
		responses=inline_serializer(
			name="ReporteOrdenesPorEstado",
			fields={
				"estado": serializers.CharField(),
				"total": serializers.IntegerField(),
			},
			many=True,
		),
	)
	def get(self, request):
		filters = self._parse_date_filters(request)
		data = (
			OrdenTrabajo.objects.filter(**filters)
			.values("estado")
			.annotate(total=Count("id"))
			.order_by("estado")
		)
		return Response(list(data))


class OrdenesPorTecnicoReporteView(BaseReporteView):
	@extend_schema(
		tags=["Reportes"],
		summary="Reporte de órdenes por técnico",
		description="Retorna conteo de órdenes agrupadas por técnico asignado, con filtro opcional por rango de fechas.",
		parameters=[
			OpenApiParameter(name="fecha_inicio", type=str, required=False, description="Formato YYYY-MM-DD"),
			OpenApiParameter(name="fecha_fin", type=str, required=False, description="Formato YYYY-MM-DD"),
		],
		responses=inline_serializer(
			name="ReporteOrdenesPorTecnico",
			fields={
				"tecnico_asignado": serializers.IntegerField(allow_null=True),
				"tecnico_asignado__username": serializers.CharField(allow_null=True),
				"total": serializers.IntegerField(),
			},
			many=True,
		),
	)
	def get(self, request):
		filters = self._parse_date_filters(request)
		data = (
			OrdenTrabajo.objects.filter(**filters)
			.values("tecnico_asignado", "tecnico_asignado__username")
			.annotate(total=Count("id"))
			.order_by("tecnico_asignado__username")
		)
		return Response(list(data))


class ConsumoRepuestosReporteView(APIView):
	permission_classes = [IsAuthenticated, ReportesGroupPermission]

	@extend_schema(
		tags=["Reportes"],
		summary="Reporte de consumo de repuestos",
		description="Retorna cantidad consumida y costo total por repuesto en consumos de órdenes.",
		parameters=[
			OpenApiParameter(name="fecha_inicio", type=str, required=False, description="Formato YYYY-MM-DD"),
			OpenApiParameter(name="fecha_fin", type=str, required=False, description="Formato YYYY-MM-DD"),
		],
		responses=inline_serializer(
			name="ReporteConsumoRepuestos",
			fields={
				"repuesto": serializers.IntegerField(),
				"repuesto__codigo": serializers.CharField(),
				"repuesto__nombre": serializers.CharField(),
				"total_cantidad": serializers.IntegerField(),
				"total_costo": serializers.DecimalField(max_digits=14, decimal_places=2),
			},
			many=True,
		),
	)
	def get(self, request):
		fecha_inicio = request.query_params.get("fecha_inicio")
		fecha_fin = request.query_params.get("fecha_fin")

		filters = {}
		if fecha_inicio:
			inicio = datetime.combine(datetime.fromisoformat(fecha_inicio).date(), time.min)
			filters["fecha__gte"] = inicio
		if fecha_fin:
			fin = datetime.combine(datetime.fromisoformat(fecha_fin).date(), time.max)
			filters["fecha__lte"] = fin

		data = (
			ConsumoOrden.objects.filter(**filters)
			.values("repuesto", "repuesto__codigo", "repuesto__nombre")
			.annotate(
				total_cantidad=Sum("cantidad"),
				total_costo=Sum(
					ExpressionWrapper(F("cantidad") * F("precio_unitario"), output_field=DecimalField(max_digits=14, decimal_places=2))
				),
			)
			.order_by("repuesto__nombre")
		)
		return Response(list(data))
