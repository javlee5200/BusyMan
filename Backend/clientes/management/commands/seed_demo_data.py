from django.core.management.base import BaseCommand

from clientes.models import Cliente
from equipos.models import Equipo


class Command(BaseCommand):
    help = "Crea datos demo iniciales: 5 clientes y 5 equipos"

    def handle(self, *args, **options):
        clientes_demo = [
            {
                "nombres": "Carlos",
                "apellidos": "Ramírez",
                "tipo_documento": "CC",
                "numero_documento": "1001001001",
                "telefono": "3001001001",
                "email": "carlos.ramirez@correo.com",
                "direccion": "Calle 10 #20-30",
            },
            {
                "nombres": "Laura",
                "apellidos": "Gómez",
                "tipo_documento": "CC",
                "numero_documento": "1001001002",
                "telefono": "3001001002",
                "email": "laura.gomez@correo.com",
                "direccion": "Carrera 15 #40-50",
            },
            {
                "nombres": "Andrés",
                "apellidos": "Morales",
                "tipo_documento": "CC",
                "numero_documento": "1001001003",
                "telefono": "3001001003",
                "email": "andres.morales@correo.com",
                "direccion": "Avenida 30 #12-18",
            },
            {
                "nombres": "Paula",
                "apellidos": "Martínez",
                "tipo_documento": "CC",
                "numero_documento": "1001001004",
                "telefono": "3001001004",
                "email": "paula.martinez@correo.com",
                "direccion": "Calle 80 #25-40",
            },
            {
                "nombres": "Jorge",
                "apellidos": "Castro",
                "tipo_documento": "CC",
                "numero_documento": "1001001005",
                "telefono": "3001001005",
                "email": "jorge.castro@correo.com",
                "direccion": "Transversal 45 #15-22",
            },
        ]

        equipos_demo = [
            {
                "numero_documento_cliente": "1001001001",
                "tipo_equipo": "PORTATIL",
                "marca": "Lenovo",
                "modelo": "ThinkPad E14",
                "numero_serie": "SN-EQ-0001",
                "accesorios_recibidos": "Cargador",
                "estado_fisico": "Buen estado, rayón leve en tapa",
                "problema_reportado": "No enciende",
                "estado_actual": "INGRESADO",
            },
            {
                "numero_documento_cliente": "1001001002",
                "tipo_equipo": "TORRE",
                "marca": "HP",
                "modelo": "Pavilion",
                "numero_serie": "SN-EQ-0002",
                "accesorios_recibidos": "Cable de poder",
                "estado_fisico": "Buen estado",
                "problema_reportado": "Reinicio constante",
                "estado_actual": "DIAGNOSTICO",
            },
            {
                "numero_documento_cliente": "1001001003",
                "tipo_equipo": "ALL_IN_ONE",
                "marca": "Dell",
                "modelo": "Inspiron 24",
                "numero_serie": "SN-EQ-0003",
                "accesorios_recibidos": "Teclado y mouse",
                "estado_fisico": "Pantalla con mancha leve",
                "problema_reportado": "Lentitud general",
                "estado_actual": "REPARACION",
            },
            {
                "numero_documento_cliente": "1001001004",
                "tipo_equipo": "IMPRESORA",
                "marca": "Epson",
                "modelo": "L3150",
                "numero_serie": "SN-EQ-0004",
                "accesorios_recibidos": "Cable USB",
                "estado_fisico": "Buen estado",
                "problema_reportado": "Atasco de papel",
                "estado_actual": "LISTO",
            },
            {
                "numero_documento_cliente": "1001001005",
                "tipo_equipo": "PORTATIL",
                "marca": "Acer",
                "modelo": "Aspire 5",
                "numero_serie": "SN-EQ-0005",
                "accesorios_recibidos": "Cargador y estuche",
                "estado_fisico": "Excelente estado",
                "problema_reportado": "Cambio de batería",
                "estado_actual": "ENTREGADO",
            },
        ]

        creados_clientes = 0
        for data in clientes_demo:
            _, created = Cliente.objects.get_or_create(
                numero_documento=data["numero_documento"],
                defaults=data,
            )
            if created:
                creados_clientes += 1

        creados_equipos = 0
        for data in equipos_demo:
            numero_documento = data.pop("numero_documento_cliente")
            cliente = Cliente.objects.filter(numero_documento=numero_documento).first()
            if not cliente:
                continue

            _, created = Equipo.objects.get_or_create(
                numero_serie=data["numero_serie"],
                defaults={"cliente": cliente, **data},
            )
            if created:
                creados_equipos += 1

        self.stdout.write(self.style.SUCCESS(f"Clientes creados: {creados_clientes}"))
        self.stdout.write(self.style.SUCCESS(f"Equipos creados: {creados_equipos}"))
        self.stdout.write(self.style.SUCCESS("Carga demo finalizada."))
