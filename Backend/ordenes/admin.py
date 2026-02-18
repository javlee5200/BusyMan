from django.contrib import admin

from .models import HistorialOrden, OrdenTrabajo


class HistorialOrdenInline(admin.TabularInline):
	model = HistorialOrden
	extra = 0
	can_delete = False
	readonly_fields = ("estado_anterior", "estado_nuevo", "comentario", "usuario", "fecha")


@admin.register(OrdenTrabajo)
class OrdenTrabajoAdmin(admin.ModelAdmin):
	list_display = (
		"id",
		"equipo",
		"tecnico_asignado",
		"estado",
		"costo_estimado",
		"costo_final",
		"fecha_creacion",
	)
	list_filter = ("estado", "fecha_creacion", "tecnico_asignado")
	search_fields = (
		"id",
		"equipo__marca",
		"equipo__modelo",
		"equipo__cliente__nombres",
		"equipo__cliente__apellidos",
	)
	readonly_fields = ("fecha_creacion", "fecha_actualizacion", "fecha_entrega")
	inlines = [HistorialOrdenInline]


@admin.register(HistorialOrden)
class HistorialOrdenAdmin(admin.ModelAdmin):
	list_display = ("orden", "estado_anterior", "estado_nuevo", "usuario", "fecha")
	list_filter = ("estado_nuevo", "fecha")
	search_fields = ("orden__id", "usuario__username", "comentario")
	readonly_fields = ("orden", "estado_anterior", "estado_nuevo", "comentario", "usuario", "fecha")
