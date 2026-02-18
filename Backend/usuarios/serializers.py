from django.contrib.auth.models import User
from rest_framework import serializers


class TecnicoComboSerializer(serializers.ModelSerializer):
    value = serializers.IntegerField(source="id", read_only=True)
    label = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "value", "label"]

    def get_label(self, obj) -> str:
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name if full_name else obj.username