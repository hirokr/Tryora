from app.models.dress_schema import DressSchema
from app.services.search_service import SearchService


def test_extract_price_from_text() -> None:
    assert SearchService._extract_price("Great dress for $129.99") == 129.99
    assert SearchService._extract_price("No price here") is None


def test_extract_dress_maps_fields() -> None:
    service = SearchService()
    item = {
        "title": "Evening Dress - BrandX",
        "link": "https://example.com/product",
        "snippet": "Elegant silhouette for USD 89.00",
        "imageUrl": "https://example.com/image.jpg",
    }

    dress = service._extract_dress(item)
    assert isinstance(dress, DressSchema)
    assert dress.title == "Evening Dress - BrandX"
    assert dress.brand == "BrandX"
    assert dress.price == 89.0
