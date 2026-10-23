import { createHash } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";

/**
 * Minimal WebSocket (RFC 6455) server side connection, enough for the mock
 * Vuu server: text messages, ping, close. No extensions, so no compression,
 * which suits a benchmark, every message costs the same on each run.
 */
export class WebSocketConnection {
  #socket: Duplex;
  #buffer: Buffer = Buffer.alloc(0);
  #fragments: Buffer[] = [];
  #closed = false;
  onmessage?: (text: string) => void;
  onclose?: () => void;

  constructor(socket: Duplex) {
    this.#socket = socket;
    socket.on("data", (chunk: Buffer) => {
      this.#buffer =
        this.#buffer.length === 0
          ? chunk
          : Buffer.concat([this.#buffer, chunk]);
      this.#readFrames();
    });
    socket.on("close", () => this.#handleClose());
    socket.on("error", () => this.#handleClose());
  }

  get closed() {
    return this.#closed;
  }

  send(text: string) {
    if (!this.#closed) this.#writeFrame(0x1, Buffer.from(text));
  }

  close() {
    if (!this.#closed) {
      this.#writeFrame(0x8, Buffer.alloc(0));
      this.#socket.end();
      this.#handleClose();
    }
  }

  #handleClose() {
    if (!this.#closed) {
      this.#closed = true;
      this.onclose?.();
    }
  }

  #writeFrame(opcode: number, payload: Buffer) {
    const length = payload.length;
    let header: Buffer;
    if (length < 126) {
      header = Buffer.from([0x80 | opcode, length]);
    } else if (length < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x80 | opcode;
      header[1] = 126;
      header.writeUInt16BE(length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x80 | opcode;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(length), 2);
    }
    this.#socket.write(Buffer.concat([header, payload]));
  }

  #readFrames() {
    for (;;) {
      const buffer = this.#buffer;
      if (buffer.length < 2) return;
      const fin = (buffer[0] & 0x80) !== 0;
      const opcode = buffer[0] & 0x0f;
      const masked = (buffer[1] & 0x80) !== 0;
      let length = buffer[1] & 0x7f;
      let offset = 2;
      if (length === 126) {
        if (buffer.length < 4) return;
        length = buffer.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (buffer.length < 10) return;
        length = Number(buffer.readBigUInt64BE(2));
        offset = 10;
      }
      const maskOffset = offset;
      if (masked) offset += 4;
      if (buffer.length < offset + length) return;

      const payload = Buffer.from(buffer.subarray(offset, offset + length));
      if (masked) {
        for (let i = 0; i < length; i++) {
          payload[i] ^= buffer[maskOffset + (i % 4)];
        }
      }
      this.#buffer = buffer.subarray(offset + length);

      switch (opcode) {
        case 0x0: // continuation
        case 0x1: // text
          this.#fragments.push(payload);
          if (fin) {
            const text = Buffer.concat(this.#fragments).toString("utf8");
            this.#fragments = [];
            this.onmessage?.(text);
          }
          break;
        case 0x8: // close
          this.close();
          return;
        case 0x9: // ping
          this.#writeFrame(0xa, payload);
          break;
        default: // pong, binary: not used
          break;
      }
    }
  }
}

/** Completes the WebSocket upgrade handshake for an http upgrade request */
export const acceptUpgrade = (req: IncomingMessage, socket: Duplex) => {
  const key = req.headers["sec-websocket-key"];
  if (typeof key !== "string") {
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
    return undefined;
  }
  const accept = createHash("sha1")
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest("base64");
  const protocol = req.headers["sec-websocket-protocol"]?.split(",")[0].trim();
  socket.write(
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${accept}`,
      ...(protocol ? [`Sec-WebSocket-Protocol: ${protocol}`] : []),
      "",
      "",
    ].join("\r\n"),
  );
  if ("setNoDelay" in socket && typeof socket.setNoDelay === "function") {
    socket.setNoDelay(true);
  }
  return new WebSocketConnection(socket);
};
