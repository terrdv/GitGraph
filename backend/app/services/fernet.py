from cryptography.fernet import Fernet
from app.core.config import settings

fernet = Fernet(settings.FERNET_KEY)

def encrypt_token(token: str) -> str:
    """Encrypt plaintext OAuth token before DB storage."""
    return fernet.encrypt(token.encode()).decode()


def decrypt_token(encrypted_token: str) -> str:
    """Decrypt token only when calling external API."""
    return fernet.decrypt(encrypted_token.encode()).decode()

