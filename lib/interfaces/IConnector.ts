import { ISocket } from './ISocket';

export type IEncoder = (reqId: number, route: string, msg: any) =>
{
    id: number,
    body: any
} | any;

export type IDecoder = (msg: any) => { id: number, route: string, body: any };

export interface IConnector {
    start(): Promise<void>;
    stop(force: boolean): Promise<void>;
    encode ?: IEncoder;

    decode ?: IDecoder;

    on(evt: 'connection' , listener: (cb: (socket: ISocket) => void, socket: ISocket) => void): void;

}