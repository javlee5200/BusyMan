from django.contrib import admin

from .models import ConsumoOrden, MovimientoInventario, Repuesto


@admin.register(Repuesto)
class RepuestoAdmin(admin.ModelAdmin):
	list_display = (
		"codigo",
		"nombre",
		"stock_actual",
		"stock_minimo",
		"costo_unitario",
		"activo",
	)
	list_filter = ("activo",)
	search_fields = ("codigo", "nombre", "descripcion")


@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
	list_display = ("fecha", "repuesto", "tipo", "cantidad", "orden_referencia", "usuario")
	list_filter = ("tipo", "fecha")
	search_fields = ("repuesto__codigo", "repuesto__nombre", "motivo")
	readonly_fields = ("fecha",)


@admin.register(ConsumoOrden)
class ConsumoOrdenAdmin(admin.ModelAdmin):
	list_display = ("fecha", "orden", "repuesto", "cantidad", "precio_unitario", "usuario")
	list_filter = ("fecha",)
	search_fields = ("orden__id", "repuesto__codigo", "repuesto__nombre")
	readonly_fields = ("fecha",)
