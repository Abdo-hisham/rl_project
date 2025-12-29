from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/environment/$', consumers.EnvironmentConsumer.as_asgi()),
    re_path(r'ws/training/$', consumers.TrainingConsumer.as_asgi()),
    re_path(r'ws/policy/$', consumers.PolicyVisualizationConsumer.as_asgi()),
]
