"""
BullBase Agent
PC'ye kurulur, portala heartbeat gönderir.
"""

import os
import sys
import time
import socket
import requests
import subprocess
import threading
from pathlib import Path

# ============================================================
# AYARLAR - Kurulumda değiştirilecek
# ============================================================
PORTAL_URL = "https://destek-portali.vercel.app"  # Vercel URL'nizi yazın
AGENT_KEY  = "BURAYA_AGENT_KEY_YAZIN"              # Her PC için unique key
INTERVAL   = 30  # Kaç saniyede bir heartbeat (saniye)
# ============================================================

HEARTBEAT_URL = f"{PORTAL_URL}/api/devices/heartbeat"

def get_local_ip():
    """Yerel IP adresini al"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "0.0.0.0"

def get_hostname():
    """Bilgisayar adını al"""
    return socket.gethostname()

def send_heartbeat():
    """Portala heartbeat gönder"""
    try:
        response = requests.post(
            HEARTBEAT_URL,
            json={
                "agent_key": AGENT_KEY,
                "ip_address": get_local_ip(),
                "hostname": get_hostname(),
            },
            timeout=10
        )
        if response.status_code == 200:
            print(f"[OK] Heartbeat gönderildi - IP: {get_local_ip()}")
        else:
            print(f"[HATA] Sunucu hatası: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("[HATA] Sunucuya bağlanılamadı")
    except Exception as e:
        print(f"[HATA] {e}")

def add_to_startup():
    """Windows başlangıcına ekle"""
    if sys.platform != "win32":
        return
    
    try:
        import winreg
        exe_path = sys.executable if getattr(sys, 'frozen', False) else f'pythonw "{os.path.abspath(__file__)}"'
        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Run",
            0, winreg.KEY_SET_VALUE
        )
        winreg.SetValueEx(key, "BullBaseAgent", 0, winreg.REG_SZ, exe_path)
        winreg.CloseKey(key)
        print("[OK] Windows başlangıcına eklendi")
    except Exception as e:
        print(f"[UYARI] Başlangıca eklenemedi: {e}")

def create_tray_icon():
    """Sistem tepsisi ikonu (pystray varsa)"""
    try:
        import pystray
        from PIL import Image, ImageDraw

        # Basit ikon oluştur
        img = Image.new('RGB', (64, 64), color='#1d4ed8')
        draw = ImageDraw.Draw(img)
        draw.ellipse([16, 16, 48, 48], fill='white')

        def on_quit(icon, item):
            icon.stop()
            sys.exit(0)

        menu = pystray.Menu(
            pystray.MenuItem("BullBase Agent", None, enabled=False),
            pystray.MenuItem(f"IP: {get_local_ip()}", None, enabled=False),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Çıkış", on_quit)
        )

        icon = pystray.Icon("BullBase", img, "BullBase Agent", menu)
        icon.run()
    except ImportError:
        # pystray yoksa sadece arka planda çalış
        pass

def main():
    print("=" * 40)
    print("  BullBase Agent v1.0")
    print("=" * 40)
    print(f"Portal: {PORTAL_URL}")
    print(f"Hostname: {get_hostname()}")
    print(f"IP: {get_local_ip()}")
    print(f"Heartbeat: her {INTERVAL} saniye")
    print("=" * 40)

    # Windows başlangıcına ekle
    add_to_startup()

    # İlk heartbeat
    send_heartbeat()

    # Tray ikonunu ayrı thread'de başlat
    tray_thread = threading.Thread(target=create_tray_icon, daemon=True)
    tray_thread.start()

    # Heartbeat döngüsü
    while True:
        time.sleep(INTERVAL)
        send_heartbeat()

if __name__ == "__main__":
    main()
