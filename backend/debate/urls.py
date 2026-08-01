# backend/debate/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('challenge/',               views.create_challenge, name='debate-challenge'),
    path('history/',                 views.debate_list,      name='debate-history'),
    path('<int:pk>/',                views.debate_detail,    name='debate-detail'),
    path('<int:pk>/end/',            views.end_debate,       name='debate-end'),
    path('<int:pk>/state/',          views.debate_state,     name='debate-state'),
    path('<int:pk>/message/',        views.debate_message,   name='debate-message'),
    path('<int:pk>/action/',         views.debate_action,    name='debate-action'),
    path('share/<uuid:share_uuid>/', views.public_share,     name='debate-share'),
]