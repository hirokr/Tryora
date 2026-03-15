"""
body_classifier.py — Body Type Classifier
------------------------------------------
Derives a human-readable body label from normalised measurements.

  tHeight   [0,1]  → SHORT (< 0.33) / AVERAGE [0.33, 0.66) / TALL (≥ 0.66)
  tFullness [0,1]  → SLIM  (< 0.33) / AVERAGE [0.33, 0.66) / PLUS (≥ 0.66)
  bodyLabel = "{HEIGHT_LABEL}_{FULLNESS_LABEL}"
  e.g. "TALL_SLIM", "AVERAGE_AVERAGE", "SHORT_PLUS"

Body type is NEVER inferred from ethnicity — they are independent attributes.
"""
from __future__ import annotations

_HEIGHT_THRESHOLDS = (0.33, 0.66)
_FULLNESS_THRESHOLDS = (0.33, 0.66)


def classify_body_label(t_height: float, t_fullness: float) -> str:
    """
    Return a body-label string from normalised height and fullness scores.

    Parameters
    ----------
    t_height : float
        Normalised height [0, 1].
    t_fullness : float
        Normalised fullness [0, 1].

    Returns
    -------
    str
        One of the 9 labels: SHORT_SLIM, SHORT_AVERAGE, SHORT_PLUS,
        AVERAGE_SLIM, AVERAGE_AVERAGE, AVERAGE_PLUS,
        TALL_SLIM, TALL_AVERAGE, TALL_PLUS.
    """
    height_label = _bucket(t_height, _HEIGHT_THRESHOLDS, ("SHORT", "AVERAGE", "TALL"))
    fullness_label = _bucket(t_fullness, _FULLNESS_THRESHOLDS, ("SLIM", "AVERAGE", "PLUS"))
    return f"{height_label}_{fullness_label}"


def _bucket(value: float, thresholds: tuple[float, float], labels: tuple[str, str, str]) -> str:
    if value < thresholds[0]:
        return labels[0]
    if value < thresholds[1]:
        return labels[1]
    return labels[2]


# All valid body labels — useful for seeding / iteration
ALL_BODY_LABELS: list[str] = [
    f"{h}_{f}"
    for h in ("SHORT", "AVERAGE", "TALL")
    for f in ("SLIM", "AVERAGE", "PLUS")
]
