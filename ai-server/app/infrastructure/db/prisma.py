"""Compatibility adapter for infrastructure DB imports.

This module intentionally re-exports the single shared Prisma client and
lifespan handler from ``app.db.prisma_connect`` to avoid creating multiple
``Prisma(auto_register=True)`` instances in one process.
"""

from app.db.prisma_connect import db, lifespan

__all__ = ["db", "lifespan"]