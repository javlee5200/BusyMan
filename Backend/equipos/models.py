from django.db import models

from clientes.models import Cliente


class Equipo(models.Model):
	TIPO_EQUIPO_CHOICES = [
		("PORTATIL", "Portátil"),
		("TORRE", "Torre"),
		("ALL_IN_ONE", "All in one"),
		("IMPRESORA", "Impresora"),
		("OTRO", "Otro"),
	]

	ESTADO_ORDEN_CHOICES = [
		("INGRESADO", "Ingresado"),
		("DIAGNOSTICO", "En diagnóstico"),
		("REPARACION", "En reparación"),
		("LISTO", "Listo"),
		("ENTREGADO", "Entregado"),
	]

	cliente = models.ForeignKey(
		Cliente,
		on_delete=models.PROTECT,
		related_name="equipos",
	)
	tipo_equipo = models.CharField(max_length=20, choices=TIPO_EQUIPO_CHOICES)
	marca = models.CharField(max_length=60)
	modelo = models.CharField(max_length=80, blank=True)
	numero_serie = models.CharField(max_length=100, unique=True, blank=True, null=True)
	accesorios_recibidos = models.TextField(blank=True)
	estado_fisico = models.TextField(blank=True)
	problema_reportado = models.TextField()
	estado_actual = models.CharField(
		max_length=20,
		choices=ESTADO_ORDEN_CHOICES,
		default="INGRESADO",
	)
	fecha_ingreso = models.DateTimeField(auto_now_add=True)
	fecha_actualizacion = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-fecha_ingreso"]

	def __str__(self):
		return f"{self.marca} {self.modelo} - {self.cliente}"
