import io
import json
from datetime import timedelta
from types import SimpleNamespace
from unittest import mock

from django.core import mail
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone
from PIL import Image
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from . import analyzer
from .throttles import AuthThrottle, ScanThrottle

CODE = "TEST-EXPERT-CODE"
GOOD = {"photo_ok": True, "crop": "Tomato", "is_healthy": False, "disease": "Late blight", "scientific_name": "Phytophthora infestans",
        "confidence": "high", "severity": "high", "visible_symptoms": ["dark patches"], "cause": "Fungus", "urgency": "Spray today",
        "organic_treatment": ["Remove leaves"], "chemical_treatment": ["Mancozeb, follow label dose"], "prevention": ["Space plants"],
        "alternatives": [{"name": "Early blight", "why": "rings"}], "see_expert_if": "spreads"}


def png(size=(64, 64), fmt="PNG"):
    b = io.BytesIO(); Image.new("RGB", size, (20, 140, 30)).save(b, fmt); b.seek(0); b.name = "leaf." + fmt.lower(); return b


def client_for(token=None):
    c = APIClient()
    if token:
        c.credentials(HTTP_AUTHORIZATION="Token " + token)
    return c


@override_settings(EXPERT_SIGNUP_CODE=CODE, SECURE_SSL_REDIRECT=False, ANTHROPIC_API_KEY="test")
class ApiTests(TestCase):
    def setUp(self):
        cache.clear()  # throttle counters live in the DB cache

    def reg(self, email, role="farmer", code=None, pw="secret1"):
        body = {"name": email.split("@")[0], "email": email, "password": pw, "role": role}
        if code:
            body["access_code"] = code
        return client_for().post("/api/auth/register/", body, format="json")

    def test_registration_rules(self):
        self.assertEqual(self.reg("a@x.com").status_code, 201)
        self.assertEqual(self.reg("a@x.com").status_code, 400)                    # duplicate
        self.assertEqual(self.reg("bad", ).status_code, 400)                      # bad email
        self.assertEqual(self.reg("b@x.com", pw="123").status_code, 400)          # short password
        self.assertEqual(self.reg("e@x.com", "expert", "wrong").status_code, 403)
        self.assertEqual(self.reg("e@x.com", "expert").status_code, 403)          # missing code
        self.assertEqual(self.reg("e@x.com", "expert", CODE).status_code, 201)

    def test_login_and_role_mismatch(self):
        self.reg("a@x.com")
        c = client_for()
        self.assertEqual(c.post("/api/auth/login/", {"email": "a@x.com", "password": "secret1", "role": "farmer"}, format="json").status_code, 200)
        self.assertEqual(c.post("/api/auth/login/", {"email": "a@x.com", "password": "secret1", "role": "expert"}, format="json").status_code, 403)
        self.assertEqual(c.post("/api/auth/login/", {"email": "a@x.com", "password": "bad", "role": "farmer"}, format="json").status_code, 401)

    def test_login_rotates_token_and_logout(self):
        old = self.reg("a@x.com").data["token"]
        new = client_for().post("/api/auth/login/", {"email": "a@x.com", "password": "secret1", "role": "farmer"}, format="json").data["token"]
        self.assertNotEqual(old, new)
        self.assertEqual(client_for(old).get("/api/auth/me/").status_code, 401)
        self.assertEqual(client_for(new).post("/api/auth/logout/").status_code, 200)
        self.assertEqual(client_for(new).get("/api/auth/me/").status_code, 401)

    def test_token_expires(self):
        tok = self.reg("a@x.com").data["token"]
        Token.objects.filter(key=tok).update(created=timezone.now() - timedelta(days=31))
        self.assertEqual(client_for(tok).get("/api/auth/me/").status_code, 401)

    def test_login_is_throttled(self):
        with mock.patch.object(AuthThrottle, "THROTTLE_RATES", {"auth": "3/hour"}):
            codes = [client_for().post("/api/auth/login/", {"email": "n@x.com", "password": "x", "role": "farmer"}, format="json").status_code for _ in range(5)]
        self.assertEqual(codes[:3], [401, 401, 401]); self.assertEqual(codes[3:], [429, 429])

    def test_advisory_permissions(self):
        f = client_for(self.reg("f@x.com").data["token"]); e = client_for(self.reg("e@x.com", "expert", CODE).data["token"])
        e2 = client_for(self.reg("e2@x.com", "expert", CODE).data["token"])
        self.assertEqual(client_for().get("/api/advisories/").status_code, 401)
        post = {"title": "PM-KISAN", "message": "Rs 6000/yr", "category": "scheme", "crop": ""}
        self.assertEqual(f.post("/api/advisories/", post, format="json").status_code, 403)
        r = e.post("/api/advisories/", post, format="json"); self.assertEqual(r.status_code, 201)
        self.assertEqual(e.post("/api/advisories/", {**post, "title": ""}, format="json").status_code, 400)
        self.assertEqual(e.post("/api/advisories/", {**post, "category": "x"}, format="json").status_code, 400)
        self.assertEqual(len(f.get("/api/advisories/").data), 1)
        self.assertEqual(f.delete(f"/api/advisories/{r.data['id']}/").status_code, 403)
        self.assertEqual(e2.delete(f"/api/advisories/{r.data['id']}/").status_code, 404)
        self.assertEqual(e.delete(f"/api/advisories/{r.data['id']}/").status_code, 204)

    def test_predict_flow(self):
        f = client_for(self.reg("f@x.com").data["token"]); e = client_for(self.reg("e@x.com", "expert", CODE).data["token"])
        self.assertEqual(e.post("/api/predict/", {"image": png()}, format="multipart").status_code, 403)
        self.assertEqual(f.post("/api/predict/", {}, format="multipart").status_code, 400)
        txt = io.BytesIO(b"hi"); txt.name = "a.txt"
        self.assertEqual(f.post("/api/predict/", {"image": txt}, format="multipart").status_code, 400)
        with mock.patch("detection.analyzer._client") as cl:
            cl.return_value.messages.create.return_value = SimpleNamespace(content=[SimpleNamespace(type="text", text="Sure:\n" + json.dumps(GOOD))])
            r = f.post("/api/predict/", {"image": png(), "crop": "Tomato", "language": "hindi"}, format="multipart")
            self.assertEqual(r.status_code, 200); self.assertEqual(r.data["disease"], "Late blight")
            sent = cl.return_value.messages.create.call_args.kwargs
            self.assertIn("Devanagari", sent["system"]); self.assertEqual(sent["messages"][0]["content"][0]["source"]["media_type"], "image/jpeg")
            cl.return_value.messages.create.return_value = SimpleNamespace(content=[SimpleNamespace(type="text", text=json.dumps({"photo_ok": False, "photo_issue": "blurry"}))])
            r = f.post("/api/predict/", {"image": png()}, format="multipart")
            self.assertFalse(r.data["photo_ok"])
        scans = f.get("/api/scans/").data
        self.assertEqual(len(scans), 1)                                           # unusable photo is not saved
        self.assertEqual(scans[0]["details"]["urgency"], "Spray today")
        self.assertEqual(e.get("/api/scans/").status_code, 403)

    def test_predict_failures_are_clean(self):
        f = client_for(self.reg("f@x.com").data["token"])
        with mock.patch("detection.analyzer._client") as cl:
            cl.return_value.messages.create.side_effect = RuntimeError("secret internal detail sk-ant-123")
            r = f.post("/api/predict/", {"image": png()}, format="multipart")
            self.assertEqual(r.status_code, 503); self.assertNotIn("sk-ant", json.dumps(r.data))
            cl.return_value.messages.create.side_effect = None
            cl.return_value.messages.create.return_value = SimpleNamespace(content=[SimpleNamespace(type="text", text="not json")])
            self.assertEqual(f.post("/api/predict/", {"image": png()}, format="multipart").status_code, 503)
        with override_settings(ANTHROPIC_API_KEY=""):
            self.assertEqual(f.post("/api/predict/", {"image": png()}, format="multipart").status_code, 503)

    def test_scan_daily_limit(self):
        f = client_for(self.reg("f@x.com").data["token"])
        with mock.patch.object(ScanThrottle, "THROTTLE_RATES", {"scan": "2/day"}), \
             mock.patch("detection.analyzer.analyze", return_value={**GOOD}):
            codes = [f.post("/api/predict/", {"image": png()}, format="multipart").status_code for _ in range(3)]
        self.assertEqual(codes, [200, 200, 429])

    def test_password_reset_flow(self):
        old = self.reg("f@x.com").data["token"]
        c = client_for()
        with override_settings(SITE_URL="https://kisan.example"):
            unknown = c.post("/api/auth/forgot/", {"email": "nobody@x.com"}, format="json")
            self.assertEqual(len(mail.outbox), 0)                                   # nothing sent for unknown email
            known = c.post("/api/auth/forgot/", {"email": "F@x.com"}, format="json")
        self.assertEqual(unknown.status_code, 200); self.assertEqual(unknown.data, known.data)   # no email enumeration
        self.assertEqual(len(mail.outbox), 1); self.assertIn("KISAN SATHI", mail.outbox[0].subject)
        link = next(l for l in mail.outbox[0].body.splitlines() if "reset-password" in l)
        q = dict(p.split("=") for p in link.split("?")[1].split("&"))
        self.assertEqual(c.post("/api/auth/reset/", {**q, "password": "123"}, format="json").status_code, 400)
        self.assertEqual(c.post("/api/auth/reset/", {**q, "token": "bad-token", "password": "newpass1"}, format="json").status_code, 400)
        self.assertEqual(c.post("/api/auth/reset/", {**q, "password": "newpass1"}, format="json").status_code, 200)
        self.assertEqual(c.post("/api/auth/reset/", {**q, "password": "another1"}, format="json").status_code, 400)  # single use
        self.assertEqual(client_for(old).get("/api/auth/me/").status_code, 401)     # old sessions killed
        self.assertEqual(c.post("/api/auth/login/", {"email": "f@x.com", "password": "newpass1", "role": "farmer"}, format="json").status_code, 200)

    def test_email_failure_does_not_break_or_leak(self):
        self.reg("f@x.com")
        with override_settings(SITE_URL="https://kisan.example"), mock.patch("detection.auth_views.send_mail", side_effect=OSError("smtp down")):
            r = client_for().post("/api/auth/forgot/", {"email": "f@x.com"}, format="json")
        self.assertEqual(r.status_code, 200)

    def test_admin_panel_reachable_and_not_swallowed_by_spa(self):
        r = self.client.get("/admin/login/", secure=True)
        self.assertEqual(r.status_code, 200); self.assertIn(b"KISAN SATHI", r.content)
        self.assertEqual(self.client.get("/admin/", secure=True).status_code, 302)  # needs login

    def test_health_is_public(self):
        self.assertEqual(client_for().get("/api/health/").status_code, 200)


class AnalyzerTests(TestCase):
    def test_normalize_clamps_and_sanitises(self):
        n = analyzer.normalize({**GOOD, "severity": "EXTREME", "confidence": "sure", "visible_symptoms": "not a list",
                                "organic_treatment": ["a"] * 30, "disease": "x" * 5000})
        self.assertEqual(n["severity"], "moderate"); self.assertEqual(n["confidence"], "low")
        self.assertEqual(n["visible_symptoms"], []); self.assertEqual(len(n["organic_treatment"]), 8); self.assertLessEqual(len(n["disease"]), 120)

    def test_bad_and_huge_images(self):
        with self.assertRaises(analyzer.BadImage): analyzer.prepare_image(b"not an image")
        out = analyzer.prepare_image(png((4000, 3000), "PNG").read())
        self.assertLessEqual(max(Image.open(io.BytesIO(out)).size), 1568)

    def test_extract_json(self):
        self.assertEqual(analyzer._extract_json('```json\n{"a": 1}\n```'), {"a": 1})
        with self.assertRaises(ValueError): analyzer._extract_json("nothing")
