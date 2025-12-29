from django.urls import path
from .views import (
    EnvironmentInfoAPIView,
    CreateEnvironmentAPIView,
    StepEnvironmentAPIView,
    AlgorithmInfoAPIView,
    RunAlgorithmAPIView,
    GetOptimalActionAPIView,
    GetPolicyForGoalAPIView,
    SimulateEpisodeAPIView
)

urlpatterns = [
    path('environment/info/', EnvironmentInfoAPIView.as_view(), name='environment-info'),
    path('environment/create/', CreateEnvironmentAPIView.as_view(), name='create-environment'),
    path('environment/step/', StepEnvironmentAPIView.as_view(), name='step-environment'),
    
    path('algorithms/info/', AlgorithmInfoAPIView.as_view(), name='algorithms-info'),
    path('algorithms/run/', RunAlgorithmAPIView.as_view(), name='run-algorithm'),
    path('algorithms/optimal-action/', GetOptimalActionAPIView.as_view(), name='optimal-action'),
    path('algorithms/policy/', GetPolicyForGoalAPIView.as_view(), name='get-policy'),
    path('algorithms/simulate/', SimulateEpisodeAPIView.as_view(), name='simulate-episode'),
]
