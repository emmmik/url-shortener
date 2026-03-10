import base62

def decode_short_code(short_code: str) -> int:
    try:
        return base62.decode(short_code)
    except ValueError:
        raise ValueError("Invalid short code")