from django.db import models
from django.contrib.auth.models import User


class Repuesto(models.Model):
	nombre = models.CharField(max_length=120)
	codigo = models.CharField(max_length=40, unique=True)
	descripcion = models.TextField(blank=True)
	stock_actual = models.PositiveIntegerField(default=0)
	stock_minimo = models.PositiveIntegerField(default=0)
	costo_unitario = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	activo = models.BooleanField(default=True)
	fecha_creacion = models.DateTimeField(auto_now_add=True)
	fecha_actualizacion = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["nombre"]

	def __str__(self):
		return f"{self.codigo} - {self.nombre}"


class MovimientoInventario(models.Model):
	TIPO_CHOICES = [
		("ENTRADA", "Entrada"),
		("SALIDA", "Salida"),
		("AJUSTE", "Ajuste"),
	]

	repuesto = models.ForeignKey(Repuesto, on_delete=models.PROTECT, related_name="movimientos")
	tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
	cantidad = models.PositiveIntegerField()
	motivo = models.CharField(max_length=255, blank=True)
	orden_referencia = models.ForeignKey(
		"ordenes.OrdenTrabajo",
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="movimientos_inventario",
	)
	usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
	fecha = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-fecha"]

	def __str__(self):
		return f"{self.tipo} {self.cantidad} - {self.repuesto.codigo}"


class ConsumoOrden(models.Model):
	orden = models.ForeignKey("ordenes.OrdenTrabajo", on_delete=models.CASCADE, related_name="consumos")
	repuesto = models.ForeignKey(Repuesto, on_delete=models.PROTECT, related_name="consumos")
	cantidad = models.PositiveIntegerField()
	precio_unitario = models.DecimalField(max_digits=12, decimal_places=2)
	usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
	fecha = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-fecha"]

	def __str__(self):
		return f"OT-{self.orden_id} | {self.repuesto.codigo} x {self.cantidad}"

# Create your models here.
