from django.db import models


class Cliente(models.Model):
	TIPO_DOCUMENTO_CHOICES = [
		("CC", "Cédula de ciudadanía"),
		("CE", "Cédula de extranjería"),
		("NIT", "NIT"),
		("OTRO", "Otro"),
	]

	nombres = models.CharField(max_length=100)
	apellidos = models.CharField(max_length=100)
	tipo_documento = models.CharField(
		max_length=10,
		choices=TIPO_DOCUMENTO_CHOICES,
		default="CC",
	)
	numero_documento = models.CharField(max_length=30, unique=True)
	telefono = models.CharField(max_length=20)
	email = models.EmailField(blank=True, null=True)
	direccion = models.CharField(max_length=255, blank=True)
	activo = models.BooleanField(default=True)
	fecha_registro = models.DateTimeField(auto_now_add=True)
	fecha_actualizacion = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-fecha_registro"]

	def __str__(self):
		return f"{self.nombres} {self.apellidos} ({self.numero_documento})"
