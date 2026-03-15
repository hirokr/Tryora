from pathlib import Path


class LocalStorage:
    def __init__(self, base_dir: str | Path) -> None:
        self.base_dir = Path(base_dir)

    def resolve(self, key: str) -> Path:
        return self.base_dir / key