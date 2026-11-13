"""Rebuild deterministic teaching files; no captured traffic or external assets."""
from pathlib import Path
import ipaddress
import struct
import zlib

DEST = Path(__file__).resolve().parents[1] / "training"


def checksum(data):
    data += b"\0" * (len(data) % 2)
    total = sum(struct.unpack("!%dH" % (len(data) // 2), data))
    while total >> 16:
        total = (total & 65535) + (total >> 16)
    return ~total & 65535


def packet(reverse, seq, ack, flags, payload=b""):
    client = ipaddress.ip_address("192.0.2.10").packed
    server = ipaddress.ip_address("192.0.2.20").packed
    src, dst = (server, client) if reverse else (client, server)
    ports = (80, 49152) if reverse else (49152, 80)
    tcp = struct.pack("!HHIIBBHHH", *ports, seq, ack, 80, flags, 8192, 0, 0)
    pseudo = src + dst + struct.pack("!BBH", 0, 6, len(tcp) + len(payload))
    tcp = tcp[:16] + struct.pack("!H", checksum(pseudo + tcp + payload)) + tcp[18:]
    ip = struct.pack("!BBHHHBBH4s4s", 69, 0, 40 + len(payload), 1, 0, 64, 6, 0, src, dst)
    ip = ip[:10] + struct.pack("!H", checksum(ip)) + ip[12:]
    mac1, mac2 = bytes.fromhex("020000000010"), bytes.fromhex("020000000020")
    eth = (mac1 + mac2 if reverse else mac2 + mac1) + b"\x08\x00"
    return eth + ip + tcp + payload


def pcap():
    request = b"GET /report.txt HTTP/1.1\r\nHost: training.example\r\nConnection: close\r\n\r\n"
    body = b"Synthetic CyberEdu training response.\n"
    response = (b"HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n"
                b"X-Backup-Note: flag{pc4p_sh0w_m3_th3_fl4g}\r\nContent-Length: "
                + str(len(body)).encode() + b"\r\nConnection: close\r\n\r\n" + body)
    c, s = 1001, 2001
    packets = [packet(False, c-1, 0, 2), packet(True, s-1, c, 18),
               packet(False, c, s, 16), packet(False, c, s, 24, request),
               packet(True, s, c+len(request), 24, response),
               packet(False, c+len(request), s+len(response), 16),
               packet(True, s+len(response), c+len(request), 17),
               packet(False, c+len(request), s+len(response)+1, 17),
               packet(True, s+len(response)+1, c+len(request)+1, 16)]
    data = struct.pack("<IHHIIII", 0xa1b2c3d4, 2, 4, 0, 0, 65535, 1)
    for index, frame in enumerate(packets):
        data += struct.pack("<IIII", 1700000000, index*1000, len(frame), len(frame)) + frame
    return data


def png():
    def chunk(name, data):
        return struct.pack("!I", len(data)) + name + data + struct.pack("!I", zlib.crc32(name+data))
    message = b"flag{st3g4n0_lsb_h1dd3n}\0"
    bits = [byte >> shift & 1 for byte in message for shift in range(7, -1, -1)]
    rows = bytearray()
    for y in range(64):
        rows.append(0)  # PNG filter: None
        for x in range(64):
            index = y*64+x
            red = (80+x*2) & 254
            rows.extend((red | (bits[index] if index < len(bits) else 0), 70+y*2, 160))
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack("!IIBBBBB", 64, 64, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(bytes(rows), 9)) + chunk(b"IEND", b""))


if __name__ == "__main__":
    DEST.mkdir(exist_ok=True)
    (DEST / "capture.pcap").write_bytes(pcap())
    (DEST / "landscape.png").write_bytes(png())
    print("Rebuilt capture.pcap and landscape.png")
