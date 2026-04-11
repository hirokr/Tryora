"""Unit tests for try-on generation router fallback logic."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.modules.try_on.generation_router import GenerationRouter


@pytest.fixture
def router_deps():
    db = MagicMock()

    cache = MagicMock()
    cache.key_result = MagicMock(return_value="glb:result:user-1:job-1")
    cache.get_glb = AsyncMock(return_value=None)
    cache.set_glb = AsyncMock()

    s3 = MagicMock()
    s3.download_bytes = AsyncMock(return_value=b"image-bytes")
    s3.upload_bytes = AsyncMock()
    s3.generate_presigned_url = AsyncMock(return_value="https://cdn.example.com/temp.jpg")

    return db, cache, s3


@pytest.mark.asyncio
async def test_generate_returns_cached_result_without_fallbacks(router_deps):
    db, cache, s3 = router_deps
    cache.get_glb = AsyncMock(return_value=b"cached-glb")

    router = GenerationRouter(db=db, cache=cache, s3=s3)

    result = await router.generate(
        job_id="job-1",
        user_id="user-1",
        t_height=0.4,
        t_fullness=0.3,
        image_s3_key="uploads/dresses/user-1/in.jpg",
    )

    assert result.provider == "cache"
    assert result.glb_bytes == b"cached-glb"
    cache.set_glb.assert_not_called()


@pytest.mark.asyncio
async def test_generate_uses_smplx_when_cache_miss_and_measurements_present(router_deps):
    db, cache, s3 = router_deps
    router = GenerationRouter(db=db, cache=cache, s3=s3)

    router._try_smplx = AsyncMock(return_value=b"smplx-glb")
    router._prepare_image = AsyncMock(return_value=(None, None))
    router._try_hf = AsyncMock(return_value=None)
    router._try_tripo = AsyncMock(return_value=None)
    router._try_template = AsyncMock(return_value=b"template-glb")

    result = await router.generate(
        job_id="job-1",
        user_id="user-1",
        t_height=0.7,
        t_fullness=0.2,
        image_s3_key=None,
    )

    assert result.provider == "smplx"
    assert result.used_fallback is False
    cache.set_glb.assert_called_once()
    router._try_template.assert_not_called()


@pytest.mark.asyncio
async def test_generate_falls_back_to_hf_when_smplx_fails(router_deps):
    db, cache, s3 = router_deps
    router = GenerationRouter(db=db, cache=cache, s3=s3)

    router._try_smplx = AsyncMock(return_value=None)
    router._prepare_image = AsyncMock(return_value=(b"img", "https://temp.example.com/x.jpg"))
    router._try_hf = AsyncMock(return_value=b"hf-glb")
    router._try_tripo = AsyncMock(return_value=None)
    router._try_template = AsyncMock(return_value=b"template-glb")

    result = await router.generate(
        job_id="job-1",
        user_id="user-1",
        t_height=0.5,
        t_fullness=0.5,
        image_s3_key="uploads/dresses/user-1/in.jpg",
    )

    assert result.provider == "hf"
    router._try_tripo.assert_not_called()
    router._try_template.assert_not_called()


@pytest.mark.asyncio
async def test_generate_falls_back_to_tripo_when_hf_fails(router_deps):
    db, cache, s3 = router_deps
    router = GenerationRouter(db=db, cache=cache, s3=s3)

    router._try_smplx = AsyncMock(return_value=None)
    router._prepare_image = AsyncMock(return_value=(b"img", "https://temp.example.com/x.jpg"))
    router._try_hf = AsyncMock(return_value=None)
    router._try_tripo = AsyncMock(return_value=b"tripo-glb")
    router._try_template = AsyncMock(return_value=b"template-glb")

    result = await router.generate(
        job_id="job-1",
        user_id="user-1",
        t_height=0.5,
        t_fullness=0.5,
        image_s3_key="uploads/dresses/user-1/in.jpg",
    )

    assert result.provider == "tripo"
    router._try_template.assert_not_called()


@pytest.mark.asyncio
async def test_generate_uses_template_as_final_fallback(router_deps):
    db, cache, s3 = router_deps
    router = GenerationRouter(db=db, cache=cache, s3=s3)

    router._try_smplx = AsyncMock(return_value=None)
    router._prepare_image = AsyncMock(return_value=(None, None))
    router._try_hf = AsyncMock(return_value=None)
    router._try_tripo = AsyncMock(return_value=None)
    router._try_template = AsyncMock(return_value=b"template-glb")

    result = await router.generate(
        job_id="job-1",
        user_id="user-1",
        t_height=0.2,
        t_fullness=0.8,
        image_s3_key=None,
        category="FORMAL",
        ethnicity="ASIAN",
        consent_given=True,
    )

    assert result.provider == "template"
    assert result.used_fallback is True
    router._try_template.assert_called_once_with(
        user_id="user-1",
        body_label="SHORT_PLUS",
        category="FORMAL",
        ethnicity="ASIAN",
        consent_given=True,
    )


@pytest.mark.asyncio
async def test_generate_raises_runtime_error_when_all_tiers_fail(router_deps):
    db, cache, s3 = router_deps
    router = GenerationRouter(db=db, cache=cache, s3=s3)

    router._try_smplx = AsyncMock(return_value=None)
    router._prepare_image = AsyncMock(return_value=(None, None))
    router._try_hf = AsyncMock(return_value=None)
    router._try_tripo = AsyncMock(return_value=None)
    router._try_template = AsyncMock(return_value=None)

    with pytest.raises(RuntimeError, match="All generation tiers failed"):
        await router.generate(
            job_id="job-1",
            user_id="user-1",
            t_height=0.4,
            t_fullness=0.4,
            image_s3_key=None,
        )


@pytest.mark.asyncio
async def test_prepare_image_returns_none_tuple_when_s3_download_fails(router_deps):
    db, cache, s3 = router_deps
    s3.download_bytes = AsyncMock(side_effect=RuntimeError("s3 outage"))

    router = GenerationRouter(db=db, cache=cache, s3=s3)

    image_bytes, image_url = await router._prepare_image(
        user_id="user-1",
        job_id="job-1",
        s3_key="uploads/dresses/user-1/in.jpg",
    )

    assert image_bytes is None
    assert image_url is None


@pytest.mark.asyncio
async def test_write_cache_swallows_runtime_error(router_deps):
    db, cache, s3 = router_deps
    cache.set_glb = AsyncMock(side_effect=RuntimeError("redis down"))

    router = GenerationRouter(db=db, cache=cache, s3=s3)

    await router._write_cache("glb:result:user-1:job-1", b"glb")
