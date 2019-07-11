/*
Riven
load dependency
"sdwireless": "file:../pxt-sdwireless"
*/

//% color="#31C7D5" weight=10 icon="\uf1eb"
namespace sdwireless {

    type EvtStr = (data: string) => void;

    let onMsg: EvtStr;
    let spi: SPI;
    let cs = pins.P8;
    let irq = pins.P2;

    function spiTx(b: string) {
        if (!spi) return;
        let tx = pins.createBuffer(b.length + 4)
        let rx = pins.createBuffer(b.length + 4)

        tx.setUint8(0, 0xff)
        tx.setUint8(1, 0xaa)
        tx.setUint8(2, 0xe0)
        tx.setUint8(3, b.length)
        for (let j = 0; j <= b.length; j++) {
            tx.setUint8(j + 4, b.charCodeAt(j))
        }
        cs.digitalWrite(false)
        spi.transfer(tx, rx)
        cs.digitalWrite(true)
    }

    function spiRx(): string {
        if (!spi) return 'No SPI';
        // max 24 bytes as microbit ble supported
        let tx = pins.createBuffer(24 + 4)
        let rx = pins.createBuffer(24 + 4)

        tx.setUint8(0, 0xff)
        tx.setUint8(1, 0xaa)
        tx.setUint8(2, 0xe0)
        tx.setUint8(3, 0)

        cs.digitalWrite(false)
        spi.transfer(tx, rx)
        cs.digitalWrite(true)
        return rx.slice(3).toString()
    }

    //% blockId=sdw_init block="SD wireless init"
    //% weight=100
    export function sdw_init(): void {
        spi = pins.createSPI(pins.P15, pins.P14, pins.P13)
        spi.setMode(3)
        spi.setFrequency(1000000)
        cs.digitalWrite(true)
        irq.onPulsed(PulseValue.High, function () {
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

