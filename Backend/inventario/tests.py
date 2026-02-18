from django.contrib.auth.models import Group, User
from rest_framework import status
from rest_framework.test import APITestCase

from clientes.models import Cliente
from equipos.models import Equipo
from ordenes.models import OrdenTrabajo
from .models import ConsumoOrden, MovimientoInventario, Repuesto


class InventarioAPITestCase(APITestCase):
	consumos_url = "/api/inventario/consumos/"

	def setUp(self):
		Group.objects.get_or_create(name="Administrador")
		Group.objects.get_or_create(name="Recepción")
		Group.objects.get_or_create(name="Técnico")

		self.recepcion = User.objects.create_user(username="recep_inv", password="Recep12345!")
		self.recepcion.groups.add(Group.objects.get(name="Recepción"))

		self.tecnico = User.objects.create_user(username="tec_inv", password="Tec12345!")
		self.tecnico.groups.add(Group.objects.get(name="Técnico"))

		cliente = Cliente.objects.create(
			nombres="Luis",
			apellidos="Rojas",
			tipo_documento="CC",
			numero_documento="800200300",
			telefono="3000002222",
			email="luis.rojas@example.com",
			direccion="Calle 7",
			activo=True,
		)

		equipo = Equipo.objects.create(
			cliente=cliente,
			tipo_equipo="PORTATIL",
			marca="HP",
			modelo="ProBook",
			numero_serie="INV-SER-01",
			accesorios_recibidos="Cargador",
			estado_fisico="Bueno",
			problema_reportado="No enciende",
			estado_actual="INGRESADO",
		)

		self.orden = OrdenTrabajo.objects.create(
			equipo=equipo,
			recepcionista=self.recepcion,
			descripcion_falla="No enciende",
			costo_estimado="60000.00",
			costo_final="0.00",
			estado="INGRESADO",
		)

		self.repuesto = Repuesto.objects.create(
			nombre="Memoria RAM 8GB",
			codigo="RAM-8GB-01",
			descripcion="DDR4",
			stock_actual=10,
			stock_minimo=2,
			costo_unitario="85000.00",
			activo=True,
		)

	def test_recepcion_can_register_consumo_and_stock_decreases(self):
		self.client.force_authenticate(user=self.recepcion)
		payload = {
			"orden": self.orden.id,
			"repuesto": self.repuesto.id,
			"cantidad": 2,
			"precio_unitario": "85000.00",
		}
		response = self.client.post(self.consumos_url, payload, format="json")

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.repuesto.refresh_from_db()
		self.assertEqual(self.repuesto.stock_actual, 8)
		self.assertEqual(ConsumoOrden.objects.count(), 1)
		self.assertEqual(MovimientoInventario.objects.count(), 1)

	def test_consumo_fails_when_stock_insufficient(self):
		self.client.force_authenticate(user=self.recepcion)
		payload = {
			"orden": self.orden.id,
			"repuesto": self.repuesto.id,
			"cantidad": 99,
			"precio_unitario": "85000.00",
		}
		response = self.client.post(self.consumos_url, payload, format="json")

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.repuesto.refresh_from_db()
		self.assertEqual(self.repuesto.stock_actual, 10)
		self.assertEqual(ConsumoOrden.objects.count(), 0)

	def test_tecnico_cannot_register_consumo(self):
		self.client.force_authenticate(user=self.tecnico)
		payload = {
			"orden": self.orden.id,
			"repuesto": self.repuesto.id,
			"cantidad": 1,
			"precio_unitario": "85000.00",
		}
		response = self.client.post(self.consumos_url, payload, format="json")
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
