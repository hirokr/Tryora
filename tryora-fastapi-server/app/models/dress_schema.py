from pydantic import BaseModel, HttpUrl


class DressSchema(BaseModel):
    title: str
    brand: str | None = None
    product_url: str
    source: str
    description: str | None = None
    price: float | None = None
    image_url: str | None = None
