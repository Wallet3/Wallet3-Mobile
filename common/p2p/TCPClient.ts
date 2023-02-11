import { Cipher, Decipher, createCipheriv, createDecipheriv, createECDH, createHash, randomBytes } from 'crypto';

import { AsyncTCPSocket } from './AsyncTCPSocket';
import { CipherAlgorithm } from './Constants';
import DeviceInfo from 'react-native-device-info';
import TCP from 'react-native-tcp-socket';

const { connect } = TCP;

export type ClientInfo = {
  devtype: string;
  device: string;
  manufacturer: string;
  name: string;
  os: string;
  osVersion: string;
};

export class TCPClient extends AsyncTCPSocket {
  private cipher!: Cipher;
  private decipher!: Decipher;
  private _verificationCode!: number | string;

  remoteInfo?: ClientInfo;

  get greeted() {
    return this.remoteInfo ? true : false;
  }

  get verificationCode() {
    return this._verificationCode;
  }

  constructor({
    service,
    socket,
    cipher,
    decipher,
    verificationCode,
  }: {
    service?: { host: string; port: number };
    socket?: TCP.Socket | TCP.TLSSocket;
    cipher?: Cipher;
    decipher?: Decipher;
    verificationCode?: string;
  }) {
    if (service && socket) {
      throw new Error(`'service' and 'socket' should NOT be initialized at the same time.`);
    }

    if (socket && (!cipher || !decipher || !verificationCode)) {
      throw new Error('socket and cipher/decipher/verificationCode should be initialized at the same time.');
    }

    let internal: TCP.Socket | TCP.TLSSocket = socket!;

    if (service) {
      internal = connect({ port: service.port, host: service.host }, () => this.handshake());
    }

    super(internal);

    this.cipher = cipher!;
    this.decipher = decipher!;
    this._verificationCode = verificationCode!;

    if (socket) {
      this.hello();
    }
  }

  private handshake = async () => {
    try {
      const iv = randomBytes(16);
      const ecdh = createECDH('secp256k1');

      const negotiation = await this.read();
      await this.write(Buffer.from([...iv, ...ecdh.generateKeys()]));

      const siv = negotiation.subarray(0, 16);
      const negotiationKey = negotiation.subarray(16);

      const secret = ecdh.computeSecret(negotiationKey);
      this._verificationCode = `${secret.reduce((p, c) => p * BigInt(c || 1), 1n)}`.substring(6, 12);

      console.log('client computes', secret.toString('hex'), this.verificationCode);

      this.cipher = createCipheriv(CipherAlgorithm, secret, iv);
      this.decipher = createDecipheriv(CipherAlgorithm, createHash('sha256').update(secret).digest(), siv);

      await this.hello();
      this.emit('ready');
    } catch (e) {
      console.error(e);
    }
  };

  private hello = async () => {
    if (this.greeted) return;

    const selfInfo: ClientInfo = {
      name: DeviceInfo.getDeviceNameSync(),
      devtype: DeviceInfo.getDeviceType(),
      device: DeviceInfo.getDeviceId(),
      manufacturer: DeviceInfo.getManufacturerSync(),
      os: DeviceInfo.getSystemName(),
      osVersion: DeviceInfo.getSystemVersion(),
    };

    this.secureWriteString(JSON.stringify(selfInfo));

    const read = await this.secureReadString();
    console.log(read);
    this.remoteInfo = JSON.parse(read);
  };

  secureWrite(data: Buffer) {
    return this.write(this.cipher.update(data));
  }

  secureWriteString(plain: string, encoding: BufferEncoding = 'utf8') {
    return this.secureWrite(Buffer.from(plain, encoding));
  }

  async secureRead() {
    const data = await this.read();
    return this.decipher.update(data);
  }

  async secureReadString(encoding: BufferEncoding = 'utf8') {
    return (await this.secureRead()).toString(encoding);
  }
}
