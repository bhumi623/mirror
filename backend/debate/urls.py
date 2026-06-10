# backend/debate/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('challenge/',          views.create_challenge, name='debate-challenge'),
    path('history/',            views.debate_list,      name='debate-history'),
    path('<int:pk>/',           views.debate_detail,    name='debate-detail'),
    path('<int:pk>/end/',       views.end_debate,       name='debate-end'),
    path('share/<uuid:share_uuid>/', views.public_share, name='debate-share'),
]