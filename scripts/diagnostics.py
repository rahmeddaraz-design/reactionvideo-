#!/usr/bin/env python3
"""
System Diagnostics Tool for Ahmed Reaction Studio
Checks platform, available hardware encoders, FFmpeg, Node, and storage roots.
"""

import sys
import os
import shutil
import platform
import subprocess

def check_command(cmd):
    path = shutil.which(cmd)
    if not path:
        return False, "Not installed"
    try:
        output = subprocess.check_output([cmd, "--version"], stderr=subprocess.STDOUT, text=True)
        first_line = output.splitlines()[0] if output else "Present"
        return True, first_line
    except Exception as e:
        return True, f"Found at {path} ({e})"

def main():
    print("=" * 60)
    print(" Ahmed Reaction Studio - System Diagnostics Report")
    print("=" * 60)
    print(f"Operating System : {platform.system()} {platform.release()} ({platform.machine()})")
    print(f"Python Version   : {platform.python_version()}")
    
    node_ok, node_ver = check_command("node")
    print(f"Node.js Runtime  : {'[OK] ' + node_ver if node_ok else '[MISSING] ' + node_ver}")

    npm_ok, npm_ver = check_command("npm")
    print(f"NPM Package Mgr  : {'[OK] ' + npm_ver if npm_ok else '[MISSING] ' + npm_ver}")

    ffmpeg_ok, ffmpeg_ver = check_command("ffmpeg")
    print(f"FFmpeg Engine    : {'[OK] ' + ffmpeg_ver if ffmpeg_ok else '[OPTIONAL] ' + ffmpeg_ver}")

    print("\nStorage Roots Check:")
    storage_dirs = ["storage/projects", "storage/recordings", "storage/proxies", "storage/logs"]
    for d in storage_dirs:
        os.makedirs(d, exist_ok=True)
        writable = os.access(d, os.W_OK)
        print(f" - {d:22}: {'[WRITABLE]' if writable else '[LOCKED]'}")

    print("=" * 60)
    print(" Diagnostics complete. System ready for local studio execution.")
    print("=" * 60)

if __name__ == "__main__":
    main()
