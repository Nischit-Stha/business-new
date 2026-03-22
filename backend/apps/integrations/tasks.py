from celery import shared_task

from .services import sync_starr365_inventory


@shared_task
def sync_starr365_inventory_task():
    return sync_starr365_inventory()
