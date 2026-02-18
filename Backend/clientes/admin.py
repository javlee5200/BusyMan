from django.contrib import admin

from .models import Cliente


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
	list_display = (
		"nombres",
		"apellidos",
		"tipo_documento",
		"numero_documento",
		"telefono",
		"email",
		"activo",
		"fecha_registro",
	)
	list_filter = ("tipo_documento", "activo", "fecha_registro")
	search_fields = ("nombres", "apellidos", "numero_documento", "telefono", "email")
	readonly_fields = ("fecha_registro", "fecha_actualizacion")
	ordering = ("-fecha_registro",)
	list_per_page = 20
	date_hierarchy = "fecha_registro"
	fieldsets = (
		("Información personal", {
			"fields": (("nombres", "apellidos"), ("tipo_documento", "numero_documento"), "activo")
		}),
		("Contacto", {
			"fields": ("telefono", "email", "direccion")
		}),
		("Auditoría", {
			"fields": ("fecha_registro", "fecha_actualizacion")
		}),
	)
