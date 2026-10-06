"""python manage.py check_analysis  -> tests every configured AI model with a tiny leaf image and
prints exactly which one works and why the others fail (wrong model name, bad key, quota...)."""
import base64, io
from django.conf import settings
from django.core.management.base import BaseCommand
from PIL import Image, ImageDraw

from detection import analyzer


class Command(BaseCommand):
    help = "Test the AI analysis setup and show the real error for each model."

    def handle(self, *args, **opts):
        img = Image.new("RGB", (256, 256), (60, 140, 60))
        ImageDraw.Draw(img).ellipse((40, 40, 216, 216), fill=(30, 110, 30))
        buf = io.BytesIO(); img.save(buf, "JPEG"); jpeg = buf.getvalue()
        system = analyzer._system_prompt("", "english")
        ok = False
        if settings.GEMINI_API_KEY:
            body = {"systemInstruction": {"parts": [{"text": system}]},
                    "contents": [{"role": "user", "parts": [
                        {"inline_data": {"mime_type": "image/jpeg", "data": base64.b64encode(jpeg).decode()}},
                        {"text": "Reply with the JSON object only."}]}],
                    "generationConfig": {"responseMimeType": "application/json", "maxOutputTokens": 8192}}
            for m in analyzer._gemini_models():
                try:
                    analyzer._gemini_call(m, body); self.stdout.write(self.style.SUCCESS(f"Gemini {m}: OK")); ok = True
                except Exception as exc:
                    detail = getattr(exc, "read", lambda: b"")().decode(errors="replace")[:250]
                    self.stdout.write(self.style.ERROR(f"Gemini {m}: {exc} {detail}"))
        else:
            self.stdout.write("GEMINI_API_KEY not set")
        if settings.ANTHROPIC_API_KEY:
            try:
                analyzer._analyze_anthropic(jpeg, system); self.stdout.write(self.style.SUCCESS(f"Anthropic {settings.ANALYSIS_MODEL}: OK")); ok = True
            except Exception as exc:
                self.stdout.write(self.style.ERROR(f"Anthropic {settings.ANALYSIS_MODEL}: {exc}"))
        else:
            self.stdout.write("ANTHROPIC_API_KEY not set")
        self.stdout.write(self.style.SUCCESS("Analysis is working.") if ok else self.style.ERROR("No model works - fix the key/model above."))