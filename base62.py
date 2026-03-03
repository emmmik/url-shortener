base_string = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

def encode(num: int) -> str:
    if num == 0:
        return base_string[0]
    result = ""
    while num > 0:
        result = base_string[num % 62] + result
        num //= 62
    return result

def decode(short_code: str) -> int:
    result = 0
    for char in short_code:
        result = result * 62 + base_string.index(char)
    return result