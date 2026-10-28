import datetime

def utc_now() -> datetime.datetime:
    """
    Returns current UTC timestamp without timezone offset (naive UTC),
    compatible with MySQL DATETIME columns while avoiding Python 3.12+ utcnow() deprecation warnings.
    """
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
