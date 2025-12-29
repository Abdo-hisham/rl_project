from rest_framework import serializers


class Environment_State_Serializer(serializers.Serializer):
    
    Agent_Position = serializers.ListField(child=serializers.IntegerField(), help_text="Position of the agent in the gridworld as [x, y].")
    Goal_Position = serializers.ListField(child=serializers.IntegerField(), help_text="Position of the goal in the gridworld as [x, y].")
    Reward = serializers.FloatField(required=False, help_text="Reward received after the last action.")
    Terminated = serializers.BooleanField(required=False, help_text="Indicates if the episode has terminated.")

