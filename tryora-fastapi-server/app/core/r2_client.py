import boto3

from app.core.config import get_settings


def get_r2_client():
    settings = get_settings()
    endpoint_url = f"https://{settings.r2_account_id}.r2.cloudflarestorage.com"

    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
    )
