from django.contrib.auth.models import Group, User
from rest_framework import status
from rest_framework.test import APITestCase

from clientes.models import Cliente
from equipos.models import Equipo
from inventario.models import ConsumoOrden, Repuesto
from ordenes.models import OrdenTrabajo


class ReportesAPITestCase(APITestCase):
	def setUp(self):
		Group.objects.get_or_create(name="Administrador")
		Group.objects.get_or_create(name="Recepción")
		Group.objects.get_or_create(name="Técnico")

		self.recepcion = User.objects.create_user(username="recep_rep", password="Recep12345!")
		self.recepcion.groups.add(Group.objects.get(name="Recepción"))

		self.tecnico = User.objects.create_user(username="tec_rep", password="Tec12345!")
		self.tecnico.groups.add(Group.objects.get(name="Técnico"))

		cliente = Cliente.objects.create(
			nombres="Marta",
			apellidos="Ruiz",
			tipo_documento="CC",
			numero_documento="900300400",
			telefono="3007777777",
			email="marta.ruiz@example.com",
			direccion="Calle 11",
			activo=True,
		)
		equipo = Equipo.objects.create(
			cliente=cliente,
			tipo_equipo="PORTATIL",
			marca="Asus",
			modelo="VivoBook",
			numero_serie="REP-SER-01",
			accesorios_recibidos="Cargador",
			estado_fisico="Bueno",
			problema_reportado="Pantalla en negro",
			estado_actual="INGRESADO",
		)

		self.orden = OrdenTrabajo.objects.create(
			equipo=equipo,
			recepcionista=self.recepcion,
			tecnico_asignado=self.tecnico,
			descripcion_falla="Pantalla en negro",
			costo_estimado="70000.00",
			costo_final="90000.00",
			estado="REPARACION",
		)

		repuesto = Repuesto.objects.create(
			nombre="Pantalla 14 pulgadas",
			codigo="PANT-14-01",
			descripcion="Pantalla LED",
			stock_actual=5,
			stock_minimo=1,
			costo_unitario="150000.00",
			activo=True,
		)

		ConsumoOrden.objects.create(
			orden=self.orden,
			repuesto=repuesto,
			cantidad=1,
			precio_unitario="150000.00",
			usuario=self.recepcion,
		)

	def test_ordenes_por_estado_returns_data(self):
		self.client.force_authenticate(user=self.recepcion)
		response = self.client.get("/api/reportes/ordenes-por-estado/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(any(item["estado"] == "REPARACION" for item in response.data))

	def test_ordenes_por_tecnico_returns_data(self):
		self.client.force_authenticate(user=self.tecnico)
		response = self.client.get("/api/reportes/ordenes-por-tecnico/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(any(item["tecnico_asignado"] == self.tecnico.id for item in response.data))

	def test_consumo_repuestos_returns_data(self):
		self.client.force_authenticate(user=self.recepcion)
		response = self.client.get("/api/reportes/consumo-repuestos/")
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 1)
		self.assertEqual(response.data[0]["total_cantidad"], 1)
