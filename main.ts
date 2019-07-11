/*
Riven
load dependency
"sdwireless": "file:../pxt-sdwireless"
*/

//% color="#31C7D5" weight=10 icon="\uf1eb"
namespace sdwireless {

    type EvtStr = (data: string) => void;

    let onMsg: EvtStr;
    let cs = DigitalPin.P8;
    let irq = DigitalPin.P2;

    function spiTx(b: string) {
        pins.digitalWritePin(cs, 0)
        pins.spiWrite(0xff)
        pins.spiWrite(0xaa)
        pins.spiWrite(0xe0)
        pins.spiWrite(b.length)
        for (let j = 0; j <= b.length - 1; j++) {
            pins.spiWrite(b.charCodeAt(j))
        }
        pins.digitalWritePin(cs, 1)
    }

    function spiRx(): string {
        let buf = pins.createBuffer(24);
        pins.digitalWritePin(cs, 0)
        pins.spiWrite(0xff)
        pins.spiWrite(0xaa)
        pins.spiWrite(0xe1)
        pins.spiWrite(0)
        for (let j = 0; j <= 24; j++) {
            buf.setNumber(NumberFormat.UInt8LE, j, pins.spiWrite(0))
        }
        pins.digitalWritePin(cs, 1)
        return buf.toString();
    }

    //% blockId=sdw_init block="SD wireless init"
    //% weight=100
    export function sdw_init(): void {
        pins.spiPins(DigitalPin.P15, DigitalPin.P14, DigitalPin.P13)
        pins.spiFormat(8, 0)
        pins.spiFrequency(1000000)
        pins.digitalWritePin(cs, 1)
        pins.onPulsed(irq, PulseValue.Low, function () {
            let msg = spiRx()
            if (onMsg) onMsg(msg)
        })
    }

    //% blockId=sdw_tx block="Send message %data"
    //% weight=90
    export function sdw_tx(data: string): void {
        spiTx(data)
    }

    //% blockId=sdw_ondata block="on Message"
    //% weight=90
    export function sdw_ondata(handler: (sdMsg: string) => void): void {
        onMsg = handler;
    }

}

