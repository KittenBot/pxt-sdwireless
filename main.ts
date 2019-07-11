/*
Riven
load dependency
"sdwireless": "file:../pxt-sdwireless"
*/

//% color="#31C7D5" weight=10 icon="\uf1eb"
namespace sdwireless {

    type EvtStr = (data: string) => void;

    let cs = DigitalPin.P8;
    let irq = DigitalPin.P2;

    //% blockId=sdw_init block="SD wireless init"
    //% weight=100
    export function sdw_init(): void {
        pins.spiPins(DigitalPin.P15, DigitalPin.P14, DigitalPin.P13)
        pins.spiFormat(8, 0)
        pins.spiFrequency(1000000)
        pins.digitalWritePin(DigitalPin.P8, 1)
    }



}

