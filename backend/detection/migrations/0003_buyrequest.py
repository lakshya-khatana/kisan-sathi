import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('detection', '0002_marketplace'),
    ]

    operations = [
        migrations.CreateModel(
            name='BuyRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('crop', models.CharField(max_length=80)),
                ('quantity', models.CharField(max_length=40)),
                ('message', models.TextField(blank=True, max_length=500)),
                ('contact_phone', models.CharField(max_length=20)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')], default='pending', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('consumer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_buy_requests', to=settings.AUTH_USER_MODEL)),
                ('farmer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='incoming_buy_requests', to=settings.AUTH_USER_MODEL)),
                ('listing', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='buy_requests', to='detection.producelisting')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
