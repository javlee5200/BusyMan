from django.contrib import admin

from .models import Equipo


@admin.register(Equipo)
class EquipoAdmin(admin.ModelAdmin):
	list_display = (
		"cliente",
		"tipo_equipo",
		"marca",
		"modelo",
		"numero_serie",
		"estado_actual",
		"fecha_ingreso",
	)
	list_filter = ("tipo_equipo", "estado_actual", "fecha_ingreso")
	search_fields = (
		"cliente__nombres",
		"cliente__apellidos",
		"marca",
		"modelo",
		"numero_serie",
	)
	readonly_fields = ("fecha_ingreso", "fecha_actualizacion")
	ordering = ("-fecha_ingreso",)
	list_per_page = 20
	date_hierarchy = "fecha_ingreso"
	autocomplete_fields = ("cliente",)
	fieldsets = (
		("Cliente y equipo", {
			"fields": ("cliente", "tipo_equipo", "marca", "modelo", "numero_serie")
		}),
		("Recepción", {
			"fields": ("accesorios_recibidos", "estado_fisico", "problema_reportado")
		}),
		("Seguimiento", {
			"fields": ("estado_actual", "fecha_ingreso", "fecha_actualizacion")
		}),
	)
