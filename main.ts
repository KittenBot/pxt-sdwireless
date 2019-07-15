/*
Riven
load dependency
"sdwireless": "file:../pxt-sdwireless"
*/

//% color="#31C7D5" weight=10 icon="\uf1eb"
namespace sdwireless {

    type EvtStr = (data: string) => void;
    type EvtBuff = (data: Buffer) => void;
    type EvtNum = (data: number) => void;
    type EvtValue = (name: string, value: number) => void;

    let onMsg: EvtStr;
    let onMsgBuff: EvtBuff;
    // microbit radio callback
    let onMbitString: EvtStr;
    let onMbitNumber: EvtNum;
    let onMbitValue: EvtValue;

    let spi: SPI;
    let cs = pins.P8;
    let irq = pins.P2;

    // addr id: 
    // e0: tx
    // e1: rx
    // e2: config
    function spiTx(b: Buffer, ctl:boolean=false) {
        if (!spi) return;
        let tx = pins.createBuffer(b.length + 4)
        let rx = pins.createBuffer(b.length + 4)
        // check sum and service num not implement
        tx.setUint8(0, 0xff)
        tx.setUint8(1, 0xaa)
        tx.setUint8(2, 0xe0)
        tx.setUint8(3, b.length)
        for (let j = 0; j <= b.length; j++) {
            tx.setUint8(j + 4, b[j])
        }
        cs.digitalWrite(false)
        spi.transfer(tx, rx)
        cs.digitalWrite(true)
    }

    function spiRx(): Buffer {
        if (!spi) return null;
        // max 24 bytes as microbit ble supported
        let tx = pins.createBuffer(24 + 4)
        let rx = pins.createBuffer(24 + 4)

        tx.setUint8(0, 0xff)
        tx.setUint8(1, 0xaa)
        tx.setUint8(2, 0xe1)
        tx.setUint8(3, 0)

        cs.digitalWrite(false)
        spi.transfer(tx, rx)
        cs.digitalWrite(true)
        let len = rx[3]
        return rx.slice(4, len)
    }

    //% blockId=sdw_init block="SD wireless init"
    //% weight=100
    export function sdw_init(): void {
        spi = pins.createSPI(pins.P15, pins.P14, pins.P13)
        spi.setMode(3)
        spi.setFrequency(1000000)
        cs.digitalWrite(true)

        irq.onEvent(PinEvent.PulseHigh, function () {
            let msg = spiRx()
            if (onMsg) onMsg(msg.toString())
            if (onMsgBuff) onMsgBuff(msg)
            if (onMbitNumber && msg[0] == PACKET_TYPE_NUMBER){
                let num = msg.getNumber(NumberFormat.Int32LE, 9)
                onMbitNumber(num)
            }
            if (onMbitString && msg[0] == PACKET_TYPE_STRING) {
                let strLen : number = msg[9]
                let strBuf = msg.slice(10, strLen)
                onMbitString(strBuf.toString())
            }
            if (onMbitValue && msg[0] == PACKET_TYPE_VALUE) {
                let value: number = msg.getNumber(NumberFormat.Int32LE, 9)
                let strLen: number = msg[13]
                let strBuf = msg.slice(14, strLen)
                onMbitValue(strBuf.toString(), value)
            }
        })
    }

    //% blockId=sdw_tx block="Send message %data"
    //% weight=90
    export function sdw_tx(data: string): void {
        data += '\n'; // force append line break in string mode
        let buf = pins.createBuffer(data.length)
        for (let i=0;i<data.length;i++){
            buf.setUint8(i, data.charCodeAt(i))
        }
        spiTx(buf)
    }

    //% blockId=sdw_ondata block="on Message"
    //% weight=90
    export function sdw_ondata(handler: (sdMsg: string) => void): void {
        onMsg = handler;
    }

    //% blockId=sdw_ondata_buff block="on Message Buff"
    //% weight=90
    export function sdw_ondata_buff(handler: (sdMsg: Buffer) => void): void {
        onMsgBuff = handler;
    }


    /*
    Packet byte layout
    | 0              | 1 ... 4       | 5 ... 8           | 9 ... 28
    ----------------------------------------------------------------
    | packet type    | system time   | serial number     | payload
    */
    // payload: number (9 ... 12)
    const PACKET_TYPE_NUMBER = 0;
    // payload: number (9 ... 12), name length (13), name (14 ... 26)
    const PACKET_TYPE_VALUE = 1;
    // payload: string length (9), string (10 ... 28)
    const PACKET_TYPE_STRING = 2;
    // payload: buffer length (9), buffer (10 ... 28)
    const PACKET_TYPE_BUFFER = 3;
    // payload: number (9 ... 16)
    const PACKET_TYPE_DOUBLE = 4;
    // payload: number (9 ... 16), name length (17), name (18 ... 26)
    const PACKET_TYPE_DOUBLE_VALUE = 5;

    //% blockId=sdw_mbit_send_string block="Send Microbit String %data"
    //% weight=80
    export function sdw_mbit_send_string(data: string): void {
        let buf = pins.createBuffer(9+1+data.length)
        buf[0] = PACKET_TYPE_STRING;
        buf[9] = data.length
        for (let i=0;i<data.length;i++){
            buf[10+i] = data.charCodeAt(i)
        }
        spiTx(buf)
    }

    //% blockId=sdw_mbit_send_number block="Send Microbit Number %data"
    //% weight=80
    export function sdw_mbit_send_number(data: number): void {
        let buf = pins.createBuffer(4 + 9)
        buf[0] = PACKET_TYPE_NUMBER;
        buf.setNumber(NumberFormat.Int32LE, 9, data);
        spiTx(buf)
    }

    //% blockId=sdw_mbit_send_value block="Send Microbit Value %name = %value"
    //% weight=80
    export function sdw_mbit_send_value(name: string, value: number): void {
        let buf = pins.createBuffer(9+4+1+name.length)
        buf[0] = PACKET_TYPE_VALUE;
        buf.setNumber(NumberFormat.Int32LE, 9, value);
        buf[13] = name.length
        for (let i = 0; i < name.length; i++) {
            buf[14 + i] = name.charCodeAt(i)
        }
        spiTx(buf)
    }

    //% blockId=sdw_onmbit_number block="on Microbit Number"
    //% weight=70
    export function sdw_onmbit_number(handler: (num: number) => void): void {
        onMbitNumber = handler;
    }

    //% blockId=sdw_onmbit_string block="on Microbit String"
    //% weight=70
    export function sdw_onmbit_string(handler: (str: string) => void): void {
        onMbitString = handler;
    }

    //% blockId=sdw_onmbit_value block="on Microbit Value"
    //% weight=70
    export function sdw_onmbit_value(handler: (name: string, value: number) => void): void {
        onMbitValue = handler;
    }

    //% blockId=sdw_set_radioch block="Set Radio Group %ch"
    //% weight=60
    export function sdw_set_radioch(ch: number): void {
        let buf = pins.createBuffer(2)
        buf[0] = 1;
        buf[1] = ch;
        spiTx(buf, true)
    }

}

