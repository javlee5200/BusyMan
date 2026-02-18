from django.contrib.auth.models import Group, Permission
from django.db.models import Q
from django.db.models.signals import post_migrate
from django.dispatch import receiver


def _permission_queryset(app_labels: set[str], actions: tuple[str, ...]):
    action_filter = Q()
    for action in actions:
        action_filter |= Q(codename__startswith=f"{action}_")

    return Permission.objects.filter(
        content_type__app_label__in=app_labels
    ).filter(action_filter)


@receiver(post_migrate)
def create_default_groups(sender, **kwargs):
    admin_group, _ = Group.objects.get_or_create(name="Administrador")
    recepcion_group, _ = Group.objects.get_or_create(name="Recepción")
    tecnico_group, _ = Group.objects.get_or_create(name="Técnico")

    admin_group.permissions.set(Permission.objects.all())

    recepcion_permissions = _permission_queryset(
        app_labels={"clientes", "equipos", "ordenes"},
        actions=("view", "add", "change"),
    ) | _permission_queryset(
        app_labels={"inventario", "reportes"},
        actions=("view",),
    )
    recepcion_group.permissions.set(recepcion_permissions.distinct())

    tecnico_permissions = _permission_queryset(
        app_labels={"equipos", "ordenes"},
        actions=("view", "change"),
    ) | _permission_queryset(
        app_labels={"clientes", "inventario", "reportes"},
        actions=("view",),
    )
    tecnico_group.permissions.set(tecnico_permissions.distinct())
