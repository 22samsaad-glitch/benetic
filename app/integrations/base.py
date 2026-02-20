"""
Abstract interfaces for external service providers.
All integrations implement these base classes so they're swappable.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class EmailMessage:
    to_email: str
    to_name: str
    subject: str
    html_body: str
    from_email: str | None = None
    reply_to: str | None = None


@dataclass
class EmailResult:
    success: bool
    provider_id: str | None = None
    error: str | None = None


class EmailProvider(ABC):
    @abstractmethod
    def send(self, message: EmailMessage) -> EmailResult: ...

    @abstractmethod
    def test_connection(self) -> bool: ...


@dataclass
class SMSMessage:
    to_phone: str
    body: str
    from_phone: str | None = None


@dataclass
class SMSResult:
    success: bool
    provider_id: str | None = None
    error: str | None = None


class SMSProvider(ABC):
    @abstractmethod
    def send(self, message: SMSMessage) -> SMSResult: ...

    @abstractmethod
    def test_connection(self) -> bool: ...
